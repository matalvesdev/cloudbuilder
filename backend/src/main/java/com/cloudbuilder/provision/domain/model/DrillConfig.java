package com.cloudbuilder.provision.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "drill_configs")
public class DrillConfig {

    public static final String STATUS_SCHEDULED = "SCHEDULED";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_PASSED = "PASSED";
    public static final String STATUS_FAILED = "FAILED";

    @Id
    private UUID id;

    @Column(name = "failover_group_id", nullable = false)
    private UUID failoverGroupId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected DrillConfig() {}

    public DrillConfig(UUID failoverGroupId, String name, String description, Instant scheduledAt) {
        this.id = UUID.randomUUID();
        this.failoverGroupId = failoverGroupId;
        this.name = name;
        this.description = description;
        this.scheduledAt = scheduledAt;
        this.status = scheduledAt != null ? STATUS_SCHEDULED : STATUS_IN_PROGRESS;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getFailoverGroupId() { return failoverGroupId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Instant getScheduledAt() { return scheduledAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
