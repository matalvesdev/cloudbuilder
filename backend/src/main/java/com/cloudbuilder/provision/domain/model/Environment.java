package com.cloudbuilder.provision.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "environments")
public class Environment {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_PROVISIONING = "PROVISIONING";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_DESTROYING = "DESTROYING";
    public static final String STATUS_DESTROYED = "DESTROYED";

    public static final String BACKEND_S3 = "s3";
    public static final String BACKEND_LOCAL = "local";
    public static final String BACKEND_REMOTE = "remote";

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(name = "canvas_id", nullable = false)
    private UUID canvasId;

    @Column(name = "canvas_version", nullable = false)
    private int canvasVersion;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String region;

    @Column(name = "state_backend_type", nullable = false)
    private String stateBackendType;

    @Column(name = "state_backend_config", columnDefinition = "TEXT")
    private String stateBackendConfig;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Environment() {}

    public Environment(String tenantId, String name, UUID canvasId, int canvasVersion,
                       String provider, String region, String stateBackendType,
                       String createdBy) {
        this.id = UUID.randomUUID();
        this.tenantId = tenantId;
        this.name = name;
        this.canvasId = canvasId;
        this.canvasVersion = canvasVersion;
        this.provider = provider;
        this.region = region;
        this.stateBackendType = stateBackendType;
        this.createdBy = createdBy;
        this.status = STATUS_PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public UUID getCanvasId() { return canvasId; }
    public void setCanvasId(UUID canvasId) { this.canvasId = canvasId; }
    public int getCanvasVersion() { return canvasVersion; }
    public void setCanvasVersion(int canvasVersion) { this.canvasVersion = canvasVersion; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getStateBackendType() { return stateBackendType; }
    public void setStateBackendType(String stateBackendType) { this.stateBackendType = stateBackendType; }
    public String getStateBackendConfig() { return stateBackendConfig; }
    public void setStateBackendConfig(String stateBackendConfig) { this.stateBackendConfig = stateBackendConfig; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
