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
 * Simple in-memory rate limiter for auth endpoints.
 * Tracks requests per IP within a sliding window to mitigate brute-force attacks.
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
            if (!allowRequest(clientIp, "auth", authMaxRequests, authWindowSeconds)) {
                log.warn("Rate limit exceeded for auth endpoint - IP: {}", clientIp);
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Muitas requisições. Aguarde antes de tentar novamente.\"}");
                return;
            }
        }

        // Global rate limit for all other endpoints
        if (!allowRequest(clientIp, "global", globalMaxRequests, globalWindowSeconds)) {
            log.warn("Global rate limit exceeded - IP: {}", clientIp);
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Muitas requisições. Aguarde antes de tentar novamente.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAuthPath(String path) {
        for (var authPath : AUTH_PATHS) {
            if (path.startsWith(authPath)) return true;
        }
        return false;
    }

    private boolean allowRequest(String clientIp, String bucketKey, int maxRequests, int windowSeconds) {
        var key = clientIp + ":" + bucketKey;
        var now = System.currentTimeMillis();
        var bucket = buckets.computeIfAbsent(key, k -> new RateLimitBucket(now));
        bucket.cleanup(now, windowSeconds);
        return bucket.tryConsume(now, maxRequests, windowSeconds);
    }

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
     * Simple sliding-window rate limit bucket.
     * Not thread-safe per bucket (caller synchronizes via ConcurrentHashMap compute).
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
            // Double-check window reset race
            if (now - windowStart > windowSeconds * 1000L) {
                windowStart = now;
                counter.set(0);
            }
            var count = counter.incrementAndGet();
            return count <= maxRequests;
        }
    }
}
