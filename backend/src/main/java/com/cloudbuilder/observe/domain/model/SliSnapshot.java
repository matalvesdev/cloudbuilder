package com.cloudbuilder.observe.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * SLI (Service Level Indicator) snapshot — a single measurement of
 * an SLO's compliance at a point in time.
 */
@Entity
@Table(name = "observe_sli_snapshots")
public class SliSnapshot {

    @Id
    private String id;

    @Column(nullable = false)
    private String sloDefinitionId;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private double sliValue;

    @Column(nullable = false)
    private boolean compliant;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private Instant measuredAt;

    protected SliSnapshot() {}

    public SliSnapshot(String sloDefinitionId, String environmentId,
                       double sliValue, boolean compliant) {
        this.id = UUID.randomUUID().toString();
        this.sloDefinitionId = sloDefinitionId;
        this.environmentId = environmentId;
        this.sliValue = sliValue;
        this.compliant = compliant;
        this.measuredAt = Instant.now();
    }

    public String getId() { return id; }
    public String getSloDefinitionId() { return sloDefinitionId; }
    public String getEnvironmentId() { return environmentId; }
    public double getSliValue() { return sliValue; }
    public boolean isCompliant() { return compliant; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public Instant getMeasuredAt() { return measuredAt; }
}
