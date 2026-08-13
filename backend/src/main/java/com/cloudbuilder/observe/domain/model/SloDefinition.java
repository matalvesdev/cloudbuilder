package com.cloudbuilder.observe.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Service Level Objective definition (ADR-008).
 * Each SLO has a target (e.g. 99.9%), a window (e.g. 30d), and zero or
 * more SLI snapshots tracking compliance over time.
 */
@Entity
@Table(name = "observe_slo_definitions")
public class SloDefinition {

    @Id
    private String id;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String serviceName;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String sliType;

    @Column(nullable = false)
    private double targetValue;

    @Column(nullable = false)
    private String targetUnit;

    @Column(nullable = false)
    private long windowDays;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected SloDefinition() {}

    public SloDefinition(String environmentId, String serviceName, String name,
                         String sliType, double targetValue, String targetUnit,
                         long windowDays) {
        this.id = UUID.randomUUID().toString();
        this.environmentId = environmentId;
        this.serviceName = serviceName;
        this.name = name;
        this.sliType = sliType;
        this.targetValue = targetValue;
        this.targetUnit = targetUnit;
        this.windowDays = windowDays;
        this.status = "ACTIVE";
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getEnvironmentId() { return environmentId; }
    public String getServiceName() { return serviceName; }
    public String getName() { return name; }
    public String getSliType() { return sliType; }
    public double getTargetValue() { return targetValue; }
    public String getTargetUnit() { return targetUnit; }
    public long getWindowDays() { return windowDays; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
}
