package com.cloudbuilder.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory rate limiter per IP address (OWASP A04:2021 — Security Misconfiguration).
 *
 * Two tiers:
 * - Auth endpoints: stricter limit (default 10 req/min) to mitigate brute-force
 * - All other endpoints: global limit (default 500 req/min)
 *
 * Response headers:
 * - X-RateLimit-Limit: configured max for the endpoint tier
 * - X-RateLimit-Remaining: requests left in the current window
 * - Retry-After: seconds until the window resets (only on 429)
 *
 * NOT a replacement for a production-grade rate limiter (use Bucket4j/Redis for that).
 */
@Component
@Order(1)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    private final Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();

    @Value("${cloudbuilder.security.rate-limit.auth-max-requests:10}")
    private int authMaxRequests;

    @Value("${cloudbuilder.security.rate-limit.auth-window-seconds:60}")
    private int authWindowSeconds;

    @Value("${cloudbuilder.security.rate-limit.global-max-requests:500}")
    private int globalMaxRequests;

    @Value("${cloudbuilder.security.rate-limit.global-window-seconds:60}")
    private int globalWindowSeconds;

    private static final String[] AUTH_PATHS = {
        "/api/auth/login", "/api/v1/auth/login",
        "/api/auth/register", "/api/v1/auth/register",
        "/api/auth/forgot-password", "/api/v1/auth/forgot-password",
        "/api/auth/reset-password", "/api/v1/auth/reset-password",
        "/api/auth/refresh", "/api/v1/auth/refresh",
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        var path = request.getRequestURI();
        var clientIp = getClientIp(request);

        // Stricter rate limit for auth endpoints
        if (isAuthPath(path)) {
            var result = tryAcquire(clientIp, "auth", authMaxRequests, authWindowSeconds);
            if (!result.allowed) {
                log.warn("Rate limit exceeded for auth endpoint - IP: {}", clientIp);
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(authWindowSeconds));
                response.setHeader("X-RateLimit-Limit", String.valueOf(authMaxRequests));
                response.setHeader("X-RateLimit-Remaining", "0");
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Rate limit exceeded\",\"message\":\"Too many requests. Please retry after " + authWindowSeconds + " seconds.\"}");
                return;
            }
            response.setHeader("X-RateLimit-Limit", String.valueOf(authMaxRequests));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining));
        }

        // Global rate limit for all other endpoints
        var result = tryAcquire(clientIp, "global", globalMaxRequests, globalWindowSeconds);
        if (!result.allowed) {
            log.warn("Global rate limit exceeded - IP: {}", clientIp);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(globalWindowSeconds));
            response.setHeader("X-RateLimit-Limit", String.valueOf(globalMaxRequests));
            response.setHeader("X-RateLimit-Remaining", "0");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded\",\"message\":\"Too many requests. Please retry after " + globalWindowSeconds + " seconds.\"}");
            return;
        }
        response.setHeader("X-RateLimit-Limit", String.valueOf(globalMaxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining));

        filterChain.doFilter(request, response);
    }

    private boolean isAuthPath(String path) {
        for (var authPath : AUTH_PATHS) {
            if (path.startsWith(authPath)) return true;
        }
        return false;
    }

    private RateCheckResult tryAcquire(String clientIp, String bucketKey, int maxRequests, int windowSeconds) {
        var key = clientIp + ":" + bucketKey;
        var now = System.currentTimeMillis();
        var bucket = buckets.computeIfAbsent(key, k -> new RateLimitBucket(now));
        bucket.cleanup(now, windowSeconds);
        boolean allowed = bucket.tryConsume(now, maxRequests, windowSeconds);
        int remaining = Math.max(0, maxRequests - bucket.getCount());
        return new RateCheckResult(allowed, remaining);
    }

    private record RateCheckResult(boolean allowed, int remaining) {}

    private String getClientIp(HttpServletRequest request) {
        var xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        var xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    /**
     * Sliding-window rate limit bucket.
     * Thread-safe via ConcurrentHashMap compute; bucket itself uses atomic ops.
     */
    private static class RateLimitBucket {
        private final AtomicInteger counter = new AtomicInteger(0);
        private volatile long windowStart;

        RateLimitBucket(long now) {
            this.windowStart = now;
        }

        void cleanup(long now, int windowSeconds) {
            if (now - windowStart > windowSeconds * 1000L) {
                windowStart = now;
                counter.set(0);
            }
        }

        boolean tryConsume(long now, int maxRequests, int windowSeconds) {
            if (now - windowStart > windowSeconds * 1000L) {
                windowStart = now;
                counter.set(0);
            }
            var count = counter.incrementAndGet();
            return count <= maxRequests;
        }

        int getCount() {
            return counter.get();
        }
    }
}
