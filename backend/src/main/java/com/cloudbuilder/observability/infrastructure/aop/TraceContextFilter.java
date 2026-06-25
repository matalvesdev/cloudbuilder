package com.cloudbuilder.observability.infrastructure.aop;

import com.cloudbuilder.observability.domain.service.TraceService;
import com.cloudbuilder.shared.security.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Extracts/generates trace context from HTTP headers and records the trace
 * after request completion.
 */
@Component
@Order(1)
public class TraceContextFilter extends OncePerRequestFilter {

    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String PARENT_SPAN_ID_HEADER = "X-Parent-Span-Id";
    private static final String SPAN_ID_HEADER = "X-Span-Id";

    private final TraceService traceService;

    public TraceContextFilter(TraceService traceService) {
        this.traceService = traceService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String traceId = request.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString().replace("-", "");
        }

        String parentSpanId = request.getHeader(PARENT_SPAN_ID_HEADER);
        String spanId = UUID.randomUUID().toString().replace("-", "");

        TraceContext.set(traceId, spanId, parentSpanId);

        response.setHeader(TRACE_ID_HEADER, traceId);
        response.setHeader(SPAN_ID_HEADER, spanId);

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            String tenantId = TenantContext.getTenantId();
            if (tenantId != null) {
                String serviceName = request.getRequestURI().startsWith("/api/") ? "cloudbuilder-backend" : "unknown";
                traceService.createTrace(
                    traceId,
                    tenantId,
                    serviceName,
                    request.getMethod() + " " + request.getRequestURI(),
                    duration,
                    response.getStatus(),
                    response.getStatus() >= 500,
                    Map.of("method", request.getMethod(), "path", request.getRequestURI())
                );
                traceService.addSpan(
                    traceId,
                    spanId,
                    parentSpanId,
                    tenantId,
                    serviceName,
                    request.getMethod() + " " + request.getRequestURI(),
                    duration,
                    response.getStatus(),
                    response.getStatus() < 500 ? "OK" : "ERROR",
                    Map.of()
                );
            }
            TraceContext.clear();
        }
    }
}
