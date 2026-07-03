package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.domain.model.SshKey;
import com.cloudbuilder.iam.domain.service.SshKeyService;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ssh-keys")
@PreAuthorize("isAuthenticated()")
public class SshKeyController {

    private final SshKeyService sshKeyService;

    public SshKeyController(SshKeyService sshKeyService) {
        this.sshKeyService = sshKeyService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listKeys(@AuthenticationPrincipal UserDetails user) {
        List<SshKey> keys = sshKeyService.listKeys(user.getUsername());
        List<Map<String, Object>> result = keys.stream().map(k -> Map.<String, Object>of(
            "id", k.getId(),
            "name", k.getName(),
            "fingerprint", k.getFingerprint() != null ? k.getFingerprint() : "",
            "active", k.isActive(),
            "createdAt", k.getCreatedAt().toString(),
            "lastUsedAt", k.getLastUsedAt() != null ? k.getLastUsedAt().toString() : null
        )).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addKey(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, String> request) {
        String name = request.getOrDefault("name", "SSH Key");
        String publicKey = request.get("publicKey");
        if (publicKey == null || publicKey.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String tenantId = TenantContext.getTenantId();
        SshKey key = sshKeyService.addKey(user.getUsername(), tenantId, name, publicKey);

        return ResponseEntity.ok(Map.<String, Object>of(
            "id", key.getId(),
            "name", key.getName(),
            "fingerprint", key.getFingerprint() != null ? key.getFingerprint() : "",
            "active", key.isActive(),
            "createdAt", key.getCreatedAt().toString()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKey(@PathVariable String id, @AuthenticationPrincipal UserDetails user) {
        sshKeyService.deleteKey(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
