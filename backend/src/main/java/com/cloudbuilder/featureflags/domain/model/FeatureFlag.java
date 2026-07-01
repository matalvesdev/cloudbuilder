package com.cloudbuilder.featureflags.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Feature Flag JPA entity (ADR-032).
 * Each flag is identified by a hierarchical flag_key.
 * tenant_id = NULL means global flag; non-NULL = tenant-specific override.
 * Resolution: tenant-specific > global > default (false).
 */
@Entity
@Table(name = "feature_flags")
public class FeatureFlag {

    @Id
    private String id;

    @Column(name = "flag_key", nullable = false, length = 100)
    private String flagKey;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "tenant_id", length = 36)
    private String tenantId;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;

    @Column(length = 500)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FeatureFlag() {}

    public FeatureFlag(String flagKey, boolean enabled, String tenantId, String configJson, String description) {
        this.id = UUID.randomUUID().toString();
        this.flagKey = flagKey;
        this.enabled = enabled;
        this.tenantId = tenantId;
        this.configJson = configJson;
        this.description = description;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
        this.updatedAt = Instant.now();
    }

    public void setConfigJson(String configJson) {
        this.configJson = configJson;
        this.updatedAt = Instant.now();
    }

    public void setDescription(String description) {
        this.description = description;
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getFlagKey() { return flagKey; }
    public boolean isEnabled() { return enabled; }
    public String getTenantId() { return tenantId; }
    public String getConfigJson() { return configJson; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
