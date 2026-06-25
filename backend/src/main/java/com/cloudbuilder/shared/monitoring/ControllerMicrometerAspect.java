package com.cloudbuilder.shared.monitoring;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * AOP aspect that records Micrometer metrics for every controller request.
 * <p>
 * Captures the Four Golden Signals:
 * <ul>
 *   <li><b>Traffic</b> — {@code api.requests.total} counter (endpoint/method/status tags)</li>
 *   <li><b>Latency</b> — {@code api.request.duration} timer (endpoint tag, P50/P95/P99)</li>
 *   <li><b>Errors</b> — derived from status=5xx tag on counter</li>
 *   <li><b>Saturation</b> — HikariCP pool gauges from {@link MetricsConfig}</li>
 * </ul>
 * <p>
 * Complements the observability module's MetricsInterceptor (PostgreSQL persistence).
 */
@Aspect
@Component
public class ControllerMicrometerAspect {

    private final MeterRegistry registry;
    private final ConcurrentMap<String, Timer> timerCache = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Counter> counterCache = new ConcurrentHashMap<>();

    public ControllerMicrometerAspect(MeterRegistry registry) {
        this.registry = registry;
    }

    @Around("execution(* com.cloudbuilder..*Controller.*(..))")
    public Object measureRequest(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String endpointRaw = className.replace("Controller", "");
        String endpoint = endpointRaw.isEmpty() ? className : endpointRaw;

        String httpMethodResult = "UNKNOWN";
        HttpServletRequest request = getCurrentRequest();
        if (request != null) {
            httpMethodResult = request.getMethod();
        }

        Timer.Sample sample = Timer.start(registry);
        String statusCategory = "other";

        try {
            Object result = joinPoint.proceed();
            int statusCode = getStatusFromResponse();
            statusCategory = classifyStatus(statusCode);
            return result;
        } catch (Exception e) {
            statusCategory = "5xx";
            throw e;
        } finally {
            final String finalEndpoint = endpoint;
            final String finalHttpMethod = httpMethodResult;
            final String finalStatus = statusCategory;

            // Record duration to per-endpoint timer
            getTimer(finalEndpoint).ifPresent(t -> sample.stop(t));

            // Increment per-endpoint counter with status
            Counter counter = counterCache.computeIfAbsent(
                finalEndpoint + "|" + finalHttpMethod + "|" + finalStatus,
                key -> Counter.builder("api.requests.total")
                    .description("Total API requests")
                    .tags(
                        "endpoint", finalEndpoint,
                        "method", finalHttpMethod,
                        "status", finalStatus
                    )
                    .register(registry)
            );
            counter.increment();
        }
    }

    private java.util.Optional<Timer> getTimer(String endpoint) {
        return java.util.Optional.ofNullable(
            timerCache.computeIfAbsent(endpoint, key ->
                Timer.builder("api.request.duration")
                    .description("API request duration")
                    .tag("endpoint", endpoint)
                    .publishPercentiles(0.5, 0.95, 0.99)
                    .register(registry)
            )
        );
    }

    private String classifyStatus(int statusCode) {
        if (statusCode >= 500) return "5xx";
        if (statusCode >= 400) return "4xx";
        if (statusCode >= 300) return "3xx";
        if (statusCode >= 200) return "2xx";
        return "other";
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest() : null;
    }

    private int getStatusFromResponse() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null && attrs.getResponse() != null) {
            return attrs.getResponse().getStatus();
        }
        return 200;
    }
}
