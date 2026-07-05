package com.cloudbuilder.integration.domain.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

/**
 * OAuthService: Handles OAuth flows for Git providers (GitHub, GitLab).
 * Generates authorization URLs, exchanges codes for tokens, and fetches user info.
 */
@Service
public class OAuthService {

    private static final Logger log = LoggerFactory.getLogger(OAuthService.class);
    private final RestTemplate restTemplate;

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

    public OAuthService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public record OAuthConfig(String clientId, String clientSecret, String authUrl, String tokenUrl, String apiUrl) {}
    public record TokenResult(String accessToken, String tokenType, Instant expiresAt, String scope, String refreshToken) {}
    public record UserInfo(String id, String login, String email, String name, String avatarUrl) {}

    public String getAuthorizationUrl(String provider, String state) {
        OAuthConfig config = getConfig(provider);
        if (config == null || config.clientId().isBlank()) return null;

        String redirectUri = appUrl + "/auth/callback/" + provider;
        return config.authUrl() + "?client_id=" + config.clientId()
                + "&redirect_uri=" + redirectUri
                + "&scope=read:user user:email"
                + "&state=" + state;
    }

    public TokenResult exchangeCode(String provider, String code) {
        OAuthConfig config = getConfig(provider);
        if (config == null || config.clientId().isBlank()) {
            log.warn("OAuth not configured for provider: {}", provider);
            return null;
        }

        try {
            log.info("Exchanging code for provider: {}", provider);

            // Build token request body (GitHub/GitLab format)
            String requestBody = "client_id=" + config.clientId()
                + "&client_secret=" + config.clientSecret()
                + "&code=" + code
                + "&grant_type=authorization_code";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Accept", "application/json");

            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                config.tokenUrl(), HttpMethod.POST, request, Map.class
            );

            if (response.getBody() == null || response.getBody().containsKey("error")) {
                log.error("Token exchange failed for {}: {}", provider, response.getBody());
                return null;
            }

            Map<String, Object> body = response.getBody();
            String accessToken = (String) body.get("access_token");
            String tokenType = (String) body.getOrDefault("token_type", "bearer");
            String scope = (String) body.getOrDefault("scope", "");
            String refreshToken = (String) body.get("refresh_token");

            return new TokenResult(
                accessToken,
                tokenType,
                Instant.now().plusSeconds(3600),
                scope,
                refreshToken
            );
        } catch (Exception e) {
            log.error("Failed to exchange code for provider: {}", provider, e);
            return null;
        }
    }

    public UserInfo getUserInfo(String provider, String accessToken) {
        OAuthConfig config = getConfig(provider);
        if (config == null || config.apiUrl() == null) return null;

        try {
            log.info("Fetching user info for provider: {}", provider);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("Accept", "application/json");

            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                config.apiUrl(), HttpMethod.GET, request, Map.class
            );

            if (response.getBody() == null) {
                log.error("Failed to fetch user info from {}: empty response", provider);
                return null;
            }

            Map<String, Object> body = response.getBody();
            String id = String.valueOf(body.get("id"));
            String login = (String) body.getOrDefault("login", "");
            String email = (String) body.getOrDefault("email", "");
            String name = (String) body.getOrDefault("name", login);
            String avatarUrl = (String) body.getOrDefault("avatar_url", "");

            return new UserInfo(id, login, email, name, avatarUrl);
        } catch (Exception e) {
            log.error("Failed to fetch user info for provider: {}", provider, e);
            return null;
        }
    }

    public boolean validateToken(String provider, String token) {
        if (token == null || token.isBlank()) return false;

        OAuthConfig config = getConfig(provider);
        if (config == null || config.apiUrl() == null) return false;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.set("Accept", "application/json");

            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<Void> response = restTemplate.exchange(
                config.apiUrl(), HttpMethod.GET, request, Void.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Token validation failed for provider {}: {}", provider, e.getMessage());
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
                "https://api.gitlab.com/api/v4/user"
            );
            default -> null;
        };
    }
}
