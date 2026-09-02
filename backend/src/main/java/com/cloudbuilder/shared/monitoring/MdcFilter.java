package com.cloudbuilder.shared.monitoring;

import com.cloudbuilder.shared.monitoring.TraceContext;
import com.cloudbuilder.shared.security.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that populates SLF4J MDC with request context for structured logging.
 * <p>
 * MDC fields populated:
 * <ul>
 *   <li>{@code requestId} — unique per-request ID</li>
 *   <li>{@code traceId} — from X-Trace-Id header or generated</li>
 *   <li>{@code tenantId} — from {@link TenantContext} (set by TenantFilter)</li>
 *   <li>{@code userId} — from Spring Security Authentication (set by JwtAuthenticationFilter)</li>
 * </ul>
 * <p>
 * MDC is cleaned up in {@code finally} block to prevent context leaks between requests.
 * Logback JSON encoder includes these fields automatically via logstash-logback-encoder.
 */
@Component
@Order(0)
public class MdcFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // Per-request correlation ID
            String requestId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            MDC.put("requestId", requestId);

            // Trace ID from header or generate
            String traceId = request.getHeader("X-Trace-Id");
            if (traceId == null || traceId.isBlank()) {
                traceId = UUID.randomUUID().toString().replace("-", "");
            }
            MDC.put("traceId", traceId);

            // Let downstream filters run (they will set tenantId, userId etc.)
            filterChain.doFilter(request, response);

        } finally {
            // Sync MDC with ThreadLocal values that may have been set during request
            try {
                // TenantContext might be set by TenantFilter
                String tenantId = TenantContext.getTenantId();
                if (tenantId != null && !tenantId.isBlank()) {
                    MDC.put("tenantId", tenantId);
                }

                // User ID from Spring Security
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                    MDC.put("userId", auth.getName());
                }

                // Trace context from TraceContext ThreadLocal
                String traceFromCtx = TraceContext.getTraceId();
                if (traceFromCtx != null && !traceFromCtx.isBlank()) {
                    MDC.put("traceId", traceFromCtx);
                }
            } catch (Exception e) {
                // Swallow — MDC cleanup should never fail
            } finally {
                // Always clean up MDC to prevent context leaks
                MDC.clear();
            }
        }
    }
}
