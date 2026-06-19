package com.cloudbuilder.provision.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "failover_groups")
public class FailoverGroup {

    public static final String STATUS_HEALTHY = "HEALTHY";
    public static final String STATUS_DEGRADED = "DEGRADED";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_FAILOVER_IN_PROGRESS = "FAILOVER_IN_PROGRESS";

    @Id
    private String id;

    @Column(name = "environment_id", nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String name;

    @Column(name = "primary_region", nullable = false)
    private String primaryRegion;

    @Column(name = "secondary_regions", nullable = false, columnDefinition = "TEXT")
    private String secondaryRegions;

    @Column(name = "failover_threshold_minutes", nullable = false)
    private int failoverThresholdMinutes;

    @Column(name = "auto_failover", nullable = false)
    private boolean autoFailover;

    @Column(nullable = false)
    private String status;

    @Column(name = "last_drill_at")
    private Instant lastDrillAt;

    @Column(name = "last_failover_at")
    private Instant lastFailoverAt;

    @Column(columnDefinition = "TEXT")
    private String metrics;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected FailoverGroup() {}

    public FailoverGroup(String environmentId, String name, String primaryRegion,
                         String secondaryRegions, int failoverThresholdMinutes,
                         boolean autoFailover) {
        this.id = UUID.randomUUID().toString();
        this.environmentId = environmentId;
        this.name = name;
        this.primaryRegion = primaryRegion;
        this.secondaryRegions = secondaryRegions;
        this.failoverThresholdMinutes = failoverThresholdMinutes;
        this.autoFailover = autoFailover;
        this.status = STATUS_HEALTHY;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getEnvironmentId() { return environmentId; }
    public String getName() { return name; }
    public String getPrimaryRegion() { return primaryRegion; }
    public void setPrimaryRegion(String primaryRegion) { this.primaryRegion = primaryRegion; }
    public String getSecondaryRegions() { return secondaryRegions; }
    public void setSecondaryRegions(String secondaryRegions) { this.secondaryRegions = secondaryRegions; }
    public int getFailoverThresholdMinutes() { return failoverThresholdMinutes; }
    public boolean isAutoFailover() { return autoFailover; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getLastDrillAt() { return lastDrillAt; }
    public void setLastDrillAt(Instant lastDrillAt) { this.lastDrillAt = lastDrillAt; }
    public Instant getLastFailoverAt() { return lastFailoverAt; }
    public void setLastFailoverAt(Instant lastFailoverAt) { this.lastFailoverAt = lastFailoverAt; }
    public String getMetrics() { return metrics; }
    public void setMetrics(String metrics) { this.metrics = metrics; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
