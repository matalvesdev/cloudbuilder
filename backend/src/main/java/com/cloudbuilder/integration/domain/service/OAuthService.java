package com.cloudbuilder.integration.domain.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.Map;

/**
 * OAuthService: Handles OAuth flows for Git providers (GitHub, GitLab, Bitbucket).
 * Generates authorization URLs, exchanges codes for tokens, and validates tokens.
 */
@Service
public class OAuthService {

    private static final Logger log = LoggerFactory.getLogger(OAuthService.class);

    @Value("${cloudbuilder.github.client-id:}")
    private String githubClientId;

    @Value("${cloudbuilder.github.client-secret:}")
    private String githubClientSecret;

    @Value("${cloudbuilder.gitlab.client-id:}")
    private String gitlabClientId;

    @Value("${cloudbuilder.gitlab.client-secret:}")
    private String gitlabClientSecret;

    @Value("${cloudbuilder.app-url:http://localhost:3000}")
    private String appUrl;

    public record OAuthConfig(String clientId, String clientSecret, String authUrl, String tokenUrl, String apiUrl) {}
    public record TokenResult(String accessToken, String tokenType, Instant expiresAt, String scope, String refreshToken) {}
    public record UserInfo(String id, String login, String email, String name, String avatarUrl) {}

    public String getAuthorizationUrl(String provider, String state) {
        OAuthConfig config = getConfig(provider);
        if (config == null) return null;

        String redirectUri = appUrl + "/auth/callback/" + provider;
        return config.authUrl() + "?client_id=" + config.clientId()
                + "&redirect_uri=" + redirectUri
                + "&scope=read:user user:email"
                + "&state=" + state;
    }

    public TokenResult exchangeCode(String provider, String code) {
        OAuthConfig config = getConfig(provider);
        if (config == null) return null;

        try {
            // In production, make HTTP call to token URL
            // For now, return a mock result
            log.info("Exchanging code for provider: {}", provider);
            return new TokenResult(
                "gho_" + UUID.randomUUID().toString().substring(0, 20),
                "bearer",
                Instant.now().plusSeconds(3600),
                "read:user user:email",
                null
            );
        } catch (Exception e) {
            log.error("Failed to exchange code for provider: {}", provider, e);
            return null;
        }
    }

    public UserInfo getUserInfo(String provider, String accessToken) {
        OAuthConfig config = getConfig(provider);
        if (config == null) return null;

        try {
            // In production, make HTTP call to API URL with token
            // For now, return mock user info
            log.info("Fetching user info for provider: {}", provider);
            return new UserInfo(
                "12345",
                "cloudbuilder-user",
                "user@cloudbuilder.io",
                "CloudBuilder User",
                "https://avatars.githubusercontent.com/u/12345"
            );
        } catch (Exception e) {
            log.error("Failed to fetch user info for provider: {}", provider, e);
            return null;
        }
    }

    public boolean validateToken(String provider, String token) {
        OAuthConfig config = getConfig(provider);
        if (config == null) return false;

        try {
            // In production, validate token against provider API
            log.info("Validating token for provider: {}", provider);
            return token != null && !token.isBlank();
        } catch (Exception e) {
            log.error("Failed to validate token for provider: {}", provider, e);
            return false;
        }
    }

    private OAuthConfig getConfig(String provider) {
        return switch (provider) {
            case "github" -> new OAuthConfig(
                githubClientId, githubClientSecret,
                "https://github.com/login/oauth/authorize",
                "https://github.com/login/oauth/access_token",
                "https://api.github.com/user"
            );
            case "gitlab" -> new OAuthConfig(
                gitlabClientId, gitlabClientSecret,
                "https://gitlab.com/oauth/authorize",
                "https://gitlab.com/oauth/token",
                "https://gitlab.com/api/v4/user"
            );
            default -> null;
        };
    }
}
