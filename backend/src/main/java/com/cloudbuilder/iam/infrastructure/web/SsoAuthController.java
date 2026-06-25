package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.domain.service.SsoAuthService;
import com.cloudbuilder.iam.domain.service.SsoAuthService.AuthResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * SSO Authentication Controller.
 *
 * Implements OAuth2 Authorization Code Flow with PKCE per ADR-025.
 * Endpoints are only loaded when cloudbuilder.sso.enabled=true.
 *
 * Flow:
 * 1. GET /api/v1/auth/oauth2/{tenantId}/{providerType} → redirect to SSO provider
 * 2. GET /api/v1/auth/oauth2/callback?code=...&state=... → token exchange + redirect to frontend
 */
@RestController
@RequestMapping("/api/v1/auth/oauth2")
@ConditionalOnBean(name = "oauthStateCache")
public class SsoAuthController {

    private static final Logger log = LoggerFactory.getLogger(SsoAuthController.class);

    private final SsoAuthService ssoAuthService;

    public SsoAuthController(SsoAuthService ssoAuthService) {
        this.ssoAuthService = ssoAuthService;
    }

    /**
     * Initiate SSO login by redirecting to the provider's authorization page.
     *
     * @param tenantId     the tenant requesting SSO
     * @param providerType the SSO provider type (google, azure, okta)
     * @param redirectUri  the callback URL (passed as query param)
     * @return 302 redirect to the provider's authorization URL
     */
    @GetMapping("/{tenantId}/{providerType}")
    public ResponseEntity<Void> authorize(
            @PathVariable String tenantId,
            @PathVariable String providerType,
            @RequestParam(name = "redirect_uri", defaultValue = "http://localhost:3000/auth/callback") String redirectUri) {

        log.info("SSO authorize request: tenant={}, provider={}", tenantId, providerType);

        try {
            String authUrl = ssoAuthService.buildAuthorizationUrl(tenantId, providerType, redirectUri);
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create(authUrl));
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        } catch (IllegalArgumentException e) {
            log.warn("SSO authorize failed: {}", e.getMessage());
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create("/login?error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8)));
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        }
    }

    /**
     * Handle the OAuth2 callback from the SSO provider.
     *
     * @param code        the authorization code
     * @param state       the state parameter for CSRF validation
     * @param redirectUri the original redirect URI
     * @return 302 redirect to frontend with JWT token as hash fragment
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam("code") String code,
            @RequestParam("state") String state,
            @RequestParam(name = "redirect_uri", defaultValue = "http://localhost:3000/auth/callback") String redirectUri) {

        log.info("SSO callback received");

        try {
            AuthResult result = ssoAuthService.handleCallback(code, state, redirectUri);

            // Redirect to frontend with token in URL fragment (URL-encoded per OWASP)
            // Email intentionally omitted to avoid PII leakage in browser URL history
            String frontendUrl = redirectUri + "#token=" + URLEncoder.encode(result.accessToken(), StandardCharsets.UTF_8)
                + "&refreshToken=" + URLEncoder.encode(result.refreshToken(), StandardCharsets.UTF_8)
                + "&userId=" + URLEncoder.encode(result.userId(), StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create(frontendUrl));
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        } catch (IllegalArgumentException e) {
            log.warn("SSO callback failed: {}", e.getMessage());
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create("/login?error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8)));
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        }
    }

    /**
     * Health check endpoint for SSO availability.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
            "enabled", true,
            "message", "SSO authentication está disponível"
        ));
    }

    /**
     * Refresh an SSO user's JWT token pair.
     * Validates the refresh token and issues new access + refresh tokens.
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "refreshToken é obrigatório"));
        }

        try {
            Map<String, Object> result = ssoAuthService.refreshToken(refreshToken);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.warn("SSO refresh token failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }
}
