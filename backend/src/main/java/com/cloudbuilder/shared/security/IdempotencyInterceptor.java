package com.cloudbuilder.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Idempotency Interceptor for write operations.
 *
 * Ensures that duplicate POST/PUT/DELETE requests (due to retries, network issues)
 * are deduplicated. Uses request hash (method + path + body + tenantId) as key.
 *
 * Idempotency key can be provided via:
 * - Header: X-Idempotency-Key
 * - Query param: ?idempotencyKey=...
 *
 * Stores results for 5 minutes to prevent duplicate processing.
 */
@Component
public class IdempotencyInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyInterceptor.class);

    private final ConcurrentHashMap<String, CachedResponse> cache = new ConcurrentHashMap<>();

    private static final long CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String method = request.getMethod();

        // Only apply to write operations
        if (!"POST".equals(method) && !"PUT".equals(method) && !"DELETE".equals(method)) {
            return true;
        }

        // Get or generate idempotency key
        String idempotencyKey = request.getHeader("X-Idempotency-Key");
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            idempotencyKey = request.getParameter("idempotencyKey");
        }

        // If no key provided, generate from request content
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            idempotencyKey = generateKey(request);
        }

        // Check cache for duplicate request
        CachedResponse cached = cache.get(idempotencyKey);
        if (cached != null && !cached.isExpired()) {
            log.info("Idempotent replay detected for key: {} — returning cached response", idempotencyKey);
            response.setStatus(cached.status);
            response.setContentType(cached.contentType);
            try {
                response.getWriter().write(cached.body);
            } catch (IOException e) {
                log.debug("Failed to write cached response", e);
            }
            return false; // Skip handler
        }

        // Store key for postHandle
        request.setAttribute("idempotencyKey", idempotencyKey);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        String idempotencyKey = (String) request.getAttribute("idempotencyKey");
        if (idempotencyKey == null) return;

        int status = response.getStatus();
        String contentType = response.getContentType();
        if (contentType == null) contentType = "application/json";

        // Only cache successful responses for idempotency
        if (status >= 200 && status < 300) {
            try {
                // Note: response body is not easily readable after completion
                // Cache just the status for dedup detection
                cache.put(idempotencyKey, new CachedResponse(status, contentType, ""));
            } catch (Exception e) {
                log.debug("Failed to cache idempotent response", e);
            }
        }

        // Cleanup expired entries periodically
        if (cache.size() > 1000) {
            cache.entrySet().removeIf(e -> e.getValue().isExpired());
        }
    }

    private String generateKey(HttpServletRequest request) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append(request.getMethod()).append(":");
            sb.append(request.getRequestURI()).append(":");
            sb.append(request.getHeader("X-Tenant-Id")).append(":");
            sb.append(request.getHeader("Authorization")).append(":");

            // Read body if available
            if (request.getContentLength() > 0) {
                try {
                    var inputStream = request.getInputStream();
                    byte[] body = inputStream.readAllBytes();
                    sb.append(new String(body, StandardCharsets.UTF_8));
                } catch (IOException e) {
                    // Ignore — body not available
                }
            }

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            return "idem-" + System.currentTimeMillis();
        }
    }

    private static class CachedResponse {
        final int status;
        final String contentType;
        final String body;
        final long createdAt;

        CachedResponse(int status, String contentType, String body) {
            this.status = status;
            this.contentType = contentType;
            this.body = body;
            this.createdAt = System.currentTimeMillis();
        }

        boolean isExpired() {
            return (System.currentTimeMillis() - createdAt) > CACHE_TTL_MS;
        }
    }
}
