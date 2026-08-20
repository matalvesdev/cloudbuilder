package com.cloudbuilder.shared.web;

import com.cloudbuilder.shared.api.ApiVersionInterceptor;
import com.cloudbuilder.shared.security.IdempotencyInterceptor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

/**
 * Web client configuration for REST calls to external services.
 * Provides a properly configured {@link RestTemplate} bean with timeouts,
 * used by services such as {@code OpaClientService} and LLM clients.
 *
 * Also registers the {@link ApiVersionInterceptor} per ADR-022
 * for API versioning via Accept header, and the
 * {@link IdempotencyInterceptor} for write-operation deduplication.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ApiVersionInterceptor apiVersionInterceptor;
    private final IdempotencyInterceptor idempotencyInterceptor;

    public WebConfig(ApiVersionInterceptor apiVersionInterceptor,
                     IdempotencyInterceptor idempotencyInterceptor) {
        this.apiVersionInterceptor = apiVersionInterceptor;
        this.idempotencyInterceptor = idempotencyInterceptor;
    }

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(30))
                .build();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(apiVersionInterceptor)
                .addPathPatterns("/api/v*/**");
        registry.addInterceptor(idempotencyInterceptor)
                .addPathPatterns("/api/v*/**")
                .excludePathPatterns("/api/v1/auth/**", "/api/v1/events/stream");
    }
}
