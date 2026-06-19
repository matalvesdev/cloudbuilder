package com.cloudbuilder.multiregion.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "region_health")
public class RegionHealth {

    @Id
    private String id;

    @Column(nullable = false)
    private String regionCode;

    @Column(nullable = false)
    private String status; // HEALTHY, DEGRADED, DOWN, MAINTENANCE

    private double latencyMs;

    private double availabilityPercent;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false, updatable = false)
    private Instant checkedAt;

    protected RegionHealth() {}

    public RegionHealth(String regionCode, String status, double latencyMs, double availabilityPercent) {
        this.id = UUID.randomUUID().toString();
        this.regionCode = regionCode;
        this.status = status;
        this.latencyMs = latencyMs;
        this.availabilityPercent = availabilityPercent;
        this.checkedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getLatencyMs() { return latencyMs; }
    public void setLatencyMs(double latencyMs) { this.latencyMs = latencyMs; }
    public double getAvailabilityPercent() { return availabilityPercent; }
    public void setAvailabilityPercent(double availabilityPercent) { this.availabilityPercent = availabilityPercent; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public Instant getCheckedAt() { return checkedAt; }
}