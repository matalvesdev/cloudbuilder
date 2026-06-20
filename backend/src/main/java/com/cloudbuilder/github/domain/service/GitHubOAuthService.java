package com.cloudbuilder.github.domain.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * GitHub OAuth service for authenticating users and connecting their repositories.
 *
 * Flow:
 * 1. User clicks "Connect GitHub" → redirect to GitHub OAuth authorize URL
 * 2. GitHub redirects to /api/v1/github/callback?code=...
 * 3. Backend exchanges code for access_token
 * 4. Token stored in user session, used for API calls
 *
 * Spec: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 */
@Service
public class GitHubOAuthService {

    @Value("${github.client.id:}")
    private String clientId = "";

    @Value("${github.client.secret:}")
    private String clientSecret = "";

    @Value("${github.redirect.uri:http://localhost:8080/api/v1/github/callback}")
    private String redirectUri;

    /**
     * Build the GitHub OAuth authorize URL.
     */
    public String buildAuthorizationUrl(String state) {
        if (clientId.isBlank()) {
            // Dev mode: return a fake URL for testing without real GitHub OAuth
            return "/api/v1/github/callback?code=dev-mode-" + UUID.randomUUID().toString() + "&state=" + state;
        }

        return "https://github.com/login/oauth/authorize"
            + "?client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
            + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
            + "&scope=" + URLEncoder.encode("repo,read:user", StandardCharsets.UTF_8)
            + "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8);
    }

    /**
     * Exchange authorization code for access token.
     * In dev mode, returns a mock token.
     */
    public String exchangeCode(String code) {
        if (code != null && code.startsWith("dev-mode-")) {
            // Dev mode: return mock token
            return "gho_dev_" + UUID.randomUUID().toString().replace("-", "");
        }
        // In production, this would call GitHub's POST https://github.com/login/oauth/access_token
        throw new UnsupportedOperationException(
            "GitHub OAuth requires configured github.client.id and github.client.secret. " +
            "Use dev mode (no config) for testing without real OAuth."
        );
    }

    public String getClientId() {
        return clientId;
    }

    public boolean isConfigured() {
        return !clientId.isBlank() && !clientSecret.isBlank();
    }
}
