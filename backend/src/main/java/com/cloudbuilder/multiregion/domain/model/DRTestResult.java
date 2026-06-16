package com.cloudbuilder.multiregion.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dr_test_results")
public class DRTestResult {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID drPlanId;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private Instant testedAt;

    @Column(nullable = false)
    private int rtoActualSeconds;

    @Column(nullable = false)
    private int rpoActualSeconds;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private int durationSeconds;

    @Column(nullable = false)
    private String initiatedBy;

    protected DRTestResult() {}

    public DRTestResult(UUID drPlanId, String tenantId, int rtoActualSeconds,
                         int rpoActualSeconds, String status, String details,
                         int durationSeconds, String initiatedBy) {
        this.id = UUID.randomUUID();
        this.drPlanId = drPlanId;
        this.tenantId = tenantId;
        this.testedAt = Instant.now();
        this.rtoActualSeconds = rtoActualSeconds;
        this.rpoActualSeconds = rpoActualSeconds;
        this.status = status;
        this.details = details;
        this.durationSeconds = durationSeconds;
        this.initiatedBy = initiatedBy;
    }

    public UUID getId() { return id; }
    public UUID getDrPlanId() { return drPlanId; }
    public String getTenantId() { return tenantId; }
    public Instant getTestedAt() { return testedAt; }
    public int getRtoActualSeconds() { return rtoActualSeconds; }
    public int getRpoActualSeconds() { return rpoActualSeconds; }
    public String getStatus() { return status; }
    public String getDetails() { return details; }
    public int getDurationSeconds() { return durationSeconds; }
    public String getInitiatedBy() { return initiatedBy; }
}
