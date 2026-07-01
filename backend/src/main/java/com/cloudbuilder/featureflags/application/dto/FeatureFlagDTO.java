package com.cloudbuilder.featureflags.application.dto;

import com.cloudbuilder.featureflags.domain.model.FeatureFlag;
import java.time.Instant;

/**
 * DTO for exposing FeatureFlag data to clients.
 * Resolved combines the effective enabled state after tenant > global resolution.
 */
public class FeatureFlagDTO {

    private final String id;
    private final String flagKey;
    private final boolean enabled;
    private final String tenantId;
    private final String configJson;
    private final String description;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final boolean resolved;

    public FeatureFlagDTO(String id, String flagKey, boolean enabled, String tenantId,
                          String configJson, String description, Instant createdAt,
                          Instant updatedAt, boolean resolved) {
        this.id = id;
        this.flagKey = flagKey;
        this.enabled = enabled;
        this.tenantId = tenantId;
        this.configJson = configJson;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.resolved = resolved;
    }

    public static FeatureFlagDTO fromEntity(FeatureFlag flag, boolean resolved) {
        return new FeatureFlagDTO(
            flag.getId(),
            flag.getFlagKey(),
            flag.isEnabled(),
            flag.getTenantId(),
            flag.getConfigJson(),
            flag.getDescription(),
            flag.getCreatedAt(),
            flag.getUpdatedAt(),
            resolved
        );
    }

    public String getId() { return id; }
    public String getFlagKey() { return flagKey; }
    public boolean isEnabled() { return enabled; }
    public String getTenantId() { return tenantId; }
    public String getConfigJson() { return configJson; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public boolean isResolved() { return resolved; }
}
