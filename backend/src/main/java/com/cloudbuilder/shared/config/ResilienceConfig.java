package com.cloudbuilder.shared.config;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.context.annotation.Configuration;

import java.lang.annotation.*;

/**
 * Resilience4j configuration for fault tolerance.
 *
 * Annotations:
 * - @CircuitBreaker: opens circuit after 5 failures, half-open after 30s
 * - @Bulkhead: limits concurrent calls to 25 per service
 * - @Retry: retries 3 times with exponential backoff
 *
 * Usage on service methods:
 *   @CircuitBreaker(name = "goEngine", fallbackMethod = "fallback")
 *   @Bulkhead(name = "goEngine")
 *   @Retry(name = "goEngine")
 *   public String callGoEngine(...) { ... }
 */
@Configuration
public class ResilienceConfig {

    // Default circuit breaker configuration
    public static final String CB_DEFAULT = "default";
    public static final String CB_GO_ENGINE = "goEngine";
    public static final String CB_EXTERNAL_API = "externalApi";

    // Default bulkhead configuration
    public static final String BH_DEFAULT = "default";
    public static final String BH_GO_ENGINE = "goEngine";

    // Default retry configuration
    public static final String RT_DEFAULT = "default";
    public static final String RT_GO_ENGINE = "goEngine";

    /**
     * Composite annotation for Go Engine calls:
     * circuit breaker + bulkhead + retry.
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    @CircuitBreaker(name = CB_GO_ENGINE, fallbackMethod = "goEngineFallback")
    @Bulkhead(name = BH_GO_ENGINE)
    @Retry(name = RT_GO_ENGINE)
    public @interface GoEngineResilient {}

    /**
     * Composite annotation for external API calls:
     * circuit breaker + retry.
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    @CircuitBreaker(name = CB_EXTERNAL_API, fallbackMethod = "externalApiFallback")
    @Retry(name = RT_DEFAULT)
    public @interface ExternalApiResilient {}
}
