package com.cloudbuilder.provision.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "region_deployments")
public class RegionDeployment {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_STANDBY = "STANDBY";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_FAILING_OVER = "FAILING_OVER";

    @Id
    private UUID id;

    @Column(name = "environment_id", nullable = false)
    private UUID environmentId;

    @Column(nullable = false)
    private String region;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    @Column(name = "state_backend_config", columnDefinition = "TEXT")
    private String stateBackendConfig;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private int priority;

    @Column(name = "last_verified_at")
    private Instant lastVerifiedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected RegionDeployment() {}

    public RegionDeployment(UUID environmentId, String region, boolean primary, int priority) {
        this.id = UUID.randomUUID();
        this.environmentId = environmentId;
        this.region = region;
        this.primary = primary;
        this.priority = priority;
        this.status = primary ? STATUS_ACTIVE : STATUS_STANDBY;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getEnvironmentId() { return environmentId; }
    public String getRegion() { return region; }
    public boolean isPrimary() { return primary; }
    public void setPrimary(boolean primary) { this.primary = primary; }
    public String getStateBackendConfig() { return stateBackendConfig; }
    public void setStateBackendConfig(String stateBackendConfig) { this.stateBackendConfig = stateBackendConfig; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getPriority() { return priority; }
    public Instant getLastVerifiedAt() { return lastVerifiedAt; }
    public void setLastVerifiedAt(Instant lastVerifiedAt) { this.lastVerifiedAt = lastVerifiedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
