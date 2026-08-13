package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.domain.model.ApiToken;
import com.cloudbuilder.iam.domain.service.ApiTokenService;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/api-tokens")
@PreAuthorize("isAuthenticated()")
public class ApiTokenController {

    private final ApiTokenService apiTokenService;

    public ApiTokenController(ApiTokenService apiTokenService) {
        this.apiTokenService = apiTokenService;
    }

    private static String resolveUserId(Authentication auth) {
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails ud) return ud.getUsername();
        if (principal instanceof String s) return s;
        return principal != null ? principal.toString() : null;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listTokens(Authentication auth) {
        String userId = resolveUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();
        List<ApiToken> tokens = apiTokenService.listTokens(userId);
        List<Map<String, Object>> result = tokens.stream().map(t -> Map.<String, Object>of(
            "id", t.getId(),
            "name", t.getName(),
            "prefix", t.getTokenPrefix(),
            "scopes", t.getScopes() != null ? t.getScopes() : "",
            "active", t.isActive(),
            "createdAt", t.getCreatedAt().toString(),
            "lastUsedAt", t.getLastUsedAt() != null ? t.getLastUsedAt().toString() : null
        )).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createToken(
            Authentication auth,
            @RequestBody Map<String, String> request) {
        String userId = resolveUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();
        String name = request.getOrDefault("name", "API Token");
        String scopes = request.getOrDefault("scopes", "read,write");
        String tenantId = TenantContext.getTenantId();

        ApiTokenService.TokenResult result = apiTokenService.createToken(
                userId, tenantId, name, scopes);

        return ResponseEntity.ok(Map.<String, Object>of(
            "id", result.id(),
            "name", result.name(),
            "token", result.token(),
            "prefix", result.prefix(),
            "scopes", result.scopes(),
            "createdAt", result.createdAt().toString(),
            "message", " guarde este token — ele não será exibido novamente"
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revokeToken(@PathVariable String id, Authentication auth) {
        String userId = resolveUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();
        apiTokenService.revokeToken(id, userId);
        return ResponseEntity.noContent().build();
    }
}
