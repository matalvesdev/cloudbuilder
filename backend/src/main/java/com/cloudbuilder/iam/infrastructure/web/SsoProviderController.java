package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.domain.model.SsoProviderConfig;
import com.cloudbuilder.iam.domain.service.SsoProviderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sso")
public class SsoProviderController {

    private final SsoProviderService ssoProviderService;

    public SsoProviderController(SsoProviderService ssoProviderService) {
        this.ssoProviderService = ssoProviderService;
    }

    @PostMapping("/providers")
    public ResponseEntity<SsoProviderConfig> createProvider(@RequestBody Map<String, String> body) {
        SsoProviderConfig config = ssoProviderService.createConfig(
                body.get("providerType"),
                body.get("providerName"),
                body.get("clientId"),
                body.get("clientSecret"),
                body.get("tenantId")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(config);
    }

    @GetMapping("/providers/tenant/{tenantId}")
    public ResponseEntity<List<SsoProviderConfig>> getProvidersByTenant(@PathVariable String tenantId) {
        return ResponseEntity.ok(ssoProviderService.getConfigsByTenant(tenantId));
    }

    @GetMapping("/providers/tenant/{tenantId}/enabled")
    public ResponseEntity<List<SsoProviderConfig>> getEnabledProviders(@PathVariable String tenantId) {
        return ResponseEntity.ok(ssoProviderService.getEnabledConfigsByTenant(tenantId));
    }

    @GetMapping("/providers/{id}")
    public ResponseEntity<SsoProviderConfig> getProvider(@PathVariable String id) {
        return ssoProviderService.getConfig(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/providers/{id}/toggle")
    public ResponseEntity<SsoProviderConfig> toggleProvider(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        return ssoProviderService.toggleEnabled(id, body.getOrDefault("enabled", true))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/providers/{id}/credentials")
    public ResponseEntity<SsoProviderConfig> updateCredentials(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ssoProviderService.updateCredentials(id, body.get("clientId"), body.get("clientSecret"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/providers/{id}")
    public ResponseEntity<Void> deleteProvider(@PathVariable String id) {
        ssoProviderService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }
}
