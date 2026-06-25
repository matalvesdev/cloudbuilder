package com.cloudbuilder.multiregion.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Cross-region replication configuration for disaster recovery.
 * Defines how resources are replicated between source and target regions.
 */
@Entity
@Table(name = "replication_configs")
public class ReplicationConfig {

    public enum Strategy {
        SYNCHRONOUS,
        ASYNCHRONOUS,
        SNAPSHOT,
        STREAMING
    }

    public enum Status {
        ACTIVE,
        PAUSED,
        SYNCING,
        ERROR,
        DEGRADED
    }

    @Id
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "plan_id", nullable = false)
    private String planId;

    @Column(name = "source_region_id", nullable = false)
    private String sourceRegionId;

    @Column(name = "target_region_id", nullable = false)
    private String targetRegionId;

    @Column(name = "resource_type", nullable = false)
    private String resourceType;

    @Column(nullable = false)
    private String strategy;

    @Column(nullable = false)
    private String status;

    @Column(name = "rpo_minutes")
    private int rpoMinutes;

    @Column(name = "bandwidth_mbps")
    private int bandwidthMbps;

    @Column(name = "encryption_enabled")
    private boolean encryptionEnabled;

    @Column(name = "compression_enabled")
    private boolean compressionEnabled;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "last_sync_duration_ms")
    private long lastSyncDurationMs;

    @Column(name = "bytes_replicated")
    private long bytesReplicated;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected ReplicationConfig() {}

    public ReplicationConfig(String tenantId, String planId, String sourceRegionId,
                              String targetRegionId, String resourceType, String strategy) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.planId = planId;
        this.sourceRegionId = sourceRegionId;
        this.targetRegionId = targetRegionId;
        this.resourceType = resourceType;
        this.strategy = strategy;
        this.status = Status.ACTIVE.name();
        this.encryptionEnabled = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }
    public String getSourceRegionId() { return sourceRegionId; }
    public void setSourceRegionId(String sourceRegionId) { this.sourceRegionId = sourceRegionId; }
    public String getTargetRegionId() { return targetRegionId; }
    public void setTargetRegionId(String targetRegionId) { this.targetRegionId = targetRegionId; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getStrategy() { return strategy; }
    public void setStrategy(String strategy) { this.strategy = strategy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getRpoMinutes() { return rpoMinutes; }
    public void setRpoMinutes(int rpoMinutes) { this.rpoMinutes = rpoMinutes; }
    public int getBandwidthMbps() { return bandwidthMbps; }
    public void setBandwidthMbps(int bandwidthMbps) { this.bandwidthMbps = bandwidthMbps; }
    public boolean isEncryptionEnabled() { return encryptionEnabled; }
    public void setEncryptionEnabled(boolean encryptionEnabled) { this.encryptionEnabled = encryptionEnabled; }
    public boolean isCompressionEnabled() { return compressionEnabled; }
    public void setCompressionEnabled(boolean compressionEnabled) { this.compressionEnabled = compressionEnabled; }
    public Instant getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(Instant lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    public long getLastSyncDurationMs() { return lastSyncDurationMs; }
    public void setLastSyncDurationMs(long lastSyncDurationMs) { this.lastSyncDurationMs = lastSyncDurationMs; }
    public long getBytesReplicated() { return bytesReplicated; }
    public void setBytesReplicated(long bytesReplicated) { this.bytesReplicated = bytesReplicated; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
