package com.cloudbuilder.featureflags.infrastructure.web;

import com.cloudbuilder.featureflags.application.dto.CreateFlagRequest;
import com.cloudbuilder.featureflags.application.dto.FeatureFlagDTO;
import com.cloudbuilder.featureflags.application.dto.UpdateFlagRequest;
import com.cloudbuilder.featureflags.domain.FlagToggleEvent;
import com.cloudbuilder.featureflags.domain.service.FeatureFlagService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/feature-flags")
public class FeatureFlagController {

    private final FeatureFlagService flagService;
    private final ApplicationEventPublisher eventPublisher;

    public FeatureFlagController(FeatureFlagService flagService, ApplicationEventPublisher eventPublisher) {
        this.flagService = flagService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Get all feature flags for the current tenant.
     * Returns resolved flags (tenant > global > default).
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FeatureFlagDTO>> getFlags(Authentication auth) {
        String tenantId = resolveTenantId(auth);
        return ResponseEntity.ok(flagService.getFlags(tenantId));
    }

    /**
     * Check if a specific flag is enabled for the current tenant.
     */
    @GetMapping("/{flagKey}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> checkFlag(
            @PathVariable String flagKey,
            Authentication auth) {
        String tenantId = resolveTenantId(auth);
        boolean enabled = flagService.isEnabled(flagKey, tenantId);
        return ResponseEntity.ok(Map.of("flagKey", flagKey, "enabled", enabled));
    }

    /**
     * Check if a specific flag is enabled for the current tenant (alternate path).
     */
    @GetMapping("/{flagKey}/check")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> checkFlagAlt(
            @PathVariable String flagKey,
            Authentication auth) {
        String tenantId = resolveTenantId(auth);
        boolean enabled = flagService.isEnabled(flagKey, tenantId);
        return ResponseEntity.ok(Map.of("flagKey", flagKey, "enabled", enabled));
    }

    /**
     * Create a new feature flag (admin only).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeatureFlagDTO> createFlag(@RequestBody CreateFlagRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flagService.createFlag(request));
    }

    /**
     * Update an existing feature flag (admin only).
     * Publishes FlagToggleEvent for audit trail.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeatureFlagDTO> updateFlag(
            @PathVariable String id,
            @RequestBody UpdateFlagRequest request,
            Authentication auth) {
        return flagService.updateFlag(id, request)
                .map(dto -> {
                    // Publish audit event
                    if (request.enabled() != null) {
                        eventPublisher.publishEvent(new FlagToggleEvent(
                            dto.getFlagKey(), request.enabled(),
                            auth.getName(), dto.getTenantId()));
                    }
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a feature flag (admin only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFlag(@PathVariable String id) {
        if (flagService.deleteFlag(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Refresh the feature flag cache (admin only).
     */
    @PostMapping("/refresh")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> refreshCache() {
        flagService.refreshCache();
        return ResponseEntity.ok(Map.of("status", "cache_evicted"));
    }

    private String resolveTenantId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Map details) {
            Object tenantId = details.get("tenantId");
            if (tenantId instanceof String s) return s;
        }
        return null;
    }
}
