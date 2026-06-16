package com.cloudbuilder.multiregion.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "disaster_recovery_plans")
public class DisasterRecoveryPlan {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_region_id", nullable = false)
    private Region primaryRegion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dr_region_id", nullable = false)
    private Region drRegion;

    @Column(nullable = false)
    private String replicationStrategy; // SYNC, ASYNC, SNAPSHOT

    @Column(nullable = false)
    private int rpoMinutes; // Recovery Point Objective

    @Column(nullable = false)
    private int rtoMinutes; // Recovery Time Objective

    @Column(nullable = false)
    private String status; // ACTIVE, INACTIVE, TESTING, FAILOVER

    @Column(columnDefinition = "TEXT")
    private String failoverProcedure;

    @Column(columnDefinition = "TEXT")
    private String fallbackProcedure;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant lastTestedAt;
    private Instant lastFailoverAt;

    protected DisasterRecoveryPlan() {}

    public DisasterRecoveryPlan(String tenantId, String name, String description,
                                 Region primaryRegion, Region drRegion,
                                 String replicationStrategy, int rpoMinutes, int rtoMinutes) {
        this.id = UUID.randomUUID();
        this.tenantId = tenantId;
        this.name = name;
        this.description = description;
        this.primaryRegion = primaryRegion;
        this.drRegion = drRegion;
        this.replicationStrategy = replicationStrategy;
        this.rpoMinutes = rpoMinutes;
        this.rtoMinutes = rtoMinutes;
        this.status = "ACTIVE";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // Getters and setters
    public UUID getId() { return id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; this.updatedAt = Instant.now(); }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; this.updatedAt = Instant.now(); }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; this.updatedAt = Instant.now(); }
    public Region getPrimaryRegion() { return primaryRegion; }
    public void setPrimaryRegion(Region primaryRegion) { this.primaryRegion = primaryRegion; this.updatedAt = Instant.now(); }
    public Region getDrRegion() { return drRegion; }
    public void setDrRegion(Region drRegion) { this.drRegion = drRegion; this.updatedAt = Instant.now(); }
    public String getReplicationStrategy() { return replicationStrategy; }
    public void setReplicationStrategy(String replicationStrategy) { this.replicationStrategy = replicationStrategy; this.updatedAt = Instant.now(); }
    public int getRpoMinutes() { return rpoMinutes; }
    public void setRpoMinutes(int rpoMinutes) { this.rpoMinutes = rpoMinutes; this.updatedAt = Instant.now(); }
    public int getRtoMinutes() { return rtoMinutes; }
    public void setRtoMinutes(int rtoMinutes) { this.rtoMinutes = rtoMinutes; this.updatedAt = Instant.now(); }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; this.updatedAt = Instant.now(); }
    public String getFailoverProcedure() { return failoverProcedure; }
    public void setFailoverProcedure(String failoverProcedure) { this.failoverProcedure = failoverProcedure; this.updatedAt = Instant.now(); }
    public String getFallbackProcedure() { return fallbackProcedure; }
    public void setFallbackProcedure(String fallbackProcedure) { this.fallbackProcedure = fallbackProcedure; this.updatedAt = Instant.now(); }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getLastTestedAt() { return lastTestedAt; }
    public void setLastTestedAt(Instant lastTestedAt) { this.lastTestedAt = lastTestedAt; this.updatedAt = Instant.now(); }
    public Instant getLastFailoverAt() { return lastFailoverAt; }
    public void setLastFailoverAt(Instant lastFailoverAt) { this.lastFailoverAt = lastFailoverAt; this.updatedAt = Instant.now(); }
}