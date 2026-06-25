package com.cloudbuilder.observability.infrastructure.aop;

import com.cloudbuilder.shared.security.TenantContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * AOP aspect that automatically propagates trace context across all service calls.
 * <p>
 * Before each service method execution:
 * <ul>
 *   <li>Generates a new trace ID if none exists (e.g., from non-HTTP entry points)</li>
 *   <li>Generates a new span ID for the current call</li>
 *   <li>Preserves the parent span ID for call hierarchy tracking</li>
 * </ul>
 * <p>
 * Follows the same pattern as {@link MetricsInterceptor} for consistency.
 */
@Aspect
@Component
public class TraceInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TraceInterceptor.class);

    @Around("execution(* com.cloudbuilder..*Service.*(..))")
    public Object propagateTraceContext(ProceedingJoinPoint joinPoint) throws Throwable {
        String existingTraceId = TraceContext.getTraceId();
        String existingSpanId = TraceContext.getSpanId();

        if (existingTraceId != null) {
            // Trace already active — create a child span
            String newSpanId = UUID.randomUUID().toString().replace("-", "");
            TraceContext.set(existingTraceId, newSpanId, existingSpanId);
        } else {
            // No trace context — create a new one (e.g., async or non-HTTP entry)
            TraceContext.getOrCreateTraceId();
        }

        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        if (log.isTraceEnabled()) {
            log.trace("[Trace] {}.{} | traceId={} spanId={} parentSpanId={} | tenant={}",
                    className, methodName,
                    TraceContext.getTraceId(),
                    TraceContext.getSpanId(),
                    TraceContext.getParentSpanId(),
                    TenantContext.getTenantId());
        }

        try {
            return joinPoint.proceed();
        } finally {
            // Restore previous span context (or clear if we created a new trace)
            if (existingTraceId != null) {
                TraceContext.set(existingTraceId, existingSpanId, existingSpanId);
            } else {
                TraceContext.clear();
            }
        }
    }
}
