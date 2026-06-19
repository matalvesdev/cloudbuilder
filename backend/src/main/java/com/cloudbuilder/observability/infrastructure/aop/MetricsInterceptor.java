package com.cloudbuilder.observability.infrastructure.aop;

import com.cloudbuilder.observability.domain.service.MetricsService;
import com.cloudbuilder.shared.security.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.Map;

/**
 * AOP aspect that automatically records HTTP metrics for every controller request.
 * Captures: method name, duration, success/failure.
 */
@Aspect
@Component
public class MetricsInterceptor {

    private final MetricsService metricsService;

    public MetricsInterceptor(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @Around("execution(* com.cloudbuilder..*Controller.*(..))")
    public Object measureHttpMetrics(ProceedingJoinPoint joinPoint) throws Throwable {
        String tenantId = TenantContext.getTenantId();
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String metricName = "cloudbuilder.api." + className.replace("Controller", "") + "." + methodName;

        long start = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;

            if (tenantId != null) {
                metricsService.record(metricName + ".duration", duration, tenantId,
                    Map.of("class", className, "method", methodName));
                metricsService.record(metricName + ".count", 1, tenantId,
                    Map.of("class", className, "method", methodName, "status", "success"));
            }

            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;

            if (tenantId != null) {
                metricsService.record(metricName + ".duration", duration, tenantId,
                    Map.of("class", className, "method", methodName));
                metricsService.record(metricName + ".count", 1, tenantId,
                    Map.of("class", className, "method", methodName, "status", "error"));
            }

            throw e;
        }
    }
}
