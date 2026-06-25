package com.cloudbuilder.iam.infrastructure.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * SSO authentication configuration.
 * Only loaded when cloudbuilder.sso.enabled=true (default: false).
 *
 * Per ADR-025, SSO is disabled by default. When enabled, provides
 * the OAuth state/PKCE cache and SSO auth beans.
 */
@Configuration
@ConditionalOnProperty(name = "cloudbuilder.sso.enabled", havingValue = "true")
public class SsoAuthConfiguration {

    /**
     * Cache for OAuth2 state parameters (PKCE + CSRF).
     * Each entry is keyed by state value, stored for 10 minutes.
     * Contains: providerConfigId, codeVerifier, tenantId
     */
    @Bean
    public Cache<String, SsoStateData> oauthStateCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(1000)
                .recordStats()
                .build();
    }

    /**
     * Data stored alongside the OAuth state parameter for callback validation.
     */
    public record SsoStateData(
        String providerConfigId,
        String codeVerifier,
        String tenantId,
        String providerType
    ) {}
}
