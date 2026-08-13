package com.cloudbuilder.integration.infrastructure.web;

import com.cloudbuilder.integration.domain.model.Integration;
import com.cloudbuilder.integration.domain.service.*;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integrations")
@PreAuthorize("isAuthenticated()")
public class IntegrationController {

    private final IntegrationService integrationService;
    private final ProviderRegistry providerRegistry;
    private final OAuthService oauthService;
    private final HealthMonitorService healthMonitorService;

    public IntegrationController(IntegrationService integrationService, ProviderRegistry providerRegistry,
                                  OAuthService oauthService, HealthMonitorService healthMonitorService) {
        this.integrationService = integrationService;
        this.providerRegistry = providerRegistry;
        this.oauthService = oauthService;
        this.healthMonitorService = healthMonitorService;
    }

    // ─── Integrations CRUD ───────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Integration>> listIntegrations() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(integrationService.listIntegrations(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Integration> getIntegration(@PathVariable String id) {
        return integrationService.getIntegration(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<IntegrationService.IntegrationResult> createIntegration(
            Authentication auth,
            @RequestBody Map<String, String> request) {
        String tenantId = TenantContext.getTenantId();
        String userId = resolveUserId(auth);
        String name = request.getOrDefault("name", "Integration");
        String providerId = request.get("providerId");
        String category = request.getOrDefault("category", "custom");
        String config = request.get("config");

        if (providerId == null || !providerRegistry.isProviderSupported(providerId)) {
            return ResponseEntity.badRequest().build();
        }

        var result = integrationService.createIntegration(tenantId, userId, name, providerId, category, config);
        return ResponseEntity.ok(result);
    }

    private String resolveUserId(Authentication auth) {
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof String s) return s;
        return null;
    }

    @PostMapping("/{id}/connect")
    public ResponseEntity<Void> connectIntegration(@PathVariable String id) {
        integrationService.connectIntegration(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/disconnect")
    public ResponseEntity<Void> disconnectIntegration(@PathVariable String id) {
        integrationService.disconnectIntegration(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIntegration(@PathVariable String id) {
        integrationService.deleteIntegration(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Provider Registry ───────────────────────────────────────

    @GetMapping("/providers")
    public ResponseEntity<List<ProviderRegistry.ProviderInfo>> listProviders() {
        return ResponseEntity.ok(providerRegistry.listProviders());
    }

    @GetMapping("/providers/{category}")
    public ResponseEntity<List<ProviderRegistry.ProviderInfo>> listProvidersByCategory(@PathVariable String category) {
        return ResponseEntity.ok(providerRegistry.listByCategory(category));
    }

    @GetMapping("/providers/info/{providerId}")
    public ResponseEntity<ProviderRegistry.ProviderInfo> getProviderInfo(@PathVariable String providerId) {
        return providerRegistry.getProviderInfo(providerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── OAuth ───────────────────────────────────────────────────

    @GetMapping("/oauth/{provider}/authorize")
    public ResponseEntity<Map<String, String>> getOAuthUrl(@PathVariable String provider) {
        String state = UUID.randomUUID().toString();
        String url = oauthService.getAuthorizationUrl(provider, state);
        if (url == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(Map.of("url", url, "state", state));
    }

    @PostMapping("/oauth/{provider}/callback")
    public ResponseEntity<Map<String, Object>> handleOAuthCallback(
            @PathVariable String provider,
            @RequestBody Map<String, String> request) {
        String code = request.get("code");
        var tokenResult = oauthService.exchangeCode(provider, code);
        if (tokenResult == null) return ResponseEntity.badRequest().build();

        var userInfo = oauthService.getUserInfo(provider, tokenResult.accessToken());
        return ResponseEntity.ok(Map.<String, Object>of(
            "accessToken", tokenResult.accessToken(),
            "tokenType", tokenResult.tokenType(),
            "user", userInfo != null ? Map.of(
                "login", userInfo.login(),
                "email", userInfo.email(),
                "name", userInfo.name()
            ) : Map.of()
        ));
    }

    // ─── Health ──────────────────────────────────────────────────

    @GetMapping("/{id}/health")
    public ResponseEntity<Map<String, Object>> getHealth(@PathVariable String id) {
        return ResponseEntity.ok(healthMonitorService.getHealthStatus(id));
    }

    // ─── Stats ───────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(integrationService.getStats(tenantId));
    }
}
