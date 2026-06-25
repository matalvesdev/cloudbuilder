package com.cloudbuilder.deployment.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deployments")
public class Deployment {

    public enum Status {
        PENDING, IN_PROGRESS, SUCCESS, FAILED, ROLLED_BACK
    }

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String canvasDesignId;

    @Column(nullable = false)
    private String version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false)
    private String deployedBy;

    @Column(columnDefinition = "TEXT")
    private String executionLog;

    private Instant startedAt;

    private Instant completedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Deployment() {}

    public Deployment(String tenantId, String environmentId, String canvasDesignId,
                      String version, String deployedBy) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.environmentId = environmentId;
        this.canvasDesignId = canvasDesignId;
        this.version = version;
        this.deployedBy = deployedBy;
        this.status = Status.PENDING;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getEnvironmentId() { return environmentId; }
    public String getCanvasDesignId() { return canvasDesignId; }
    public String getVersion() { return version; }
    public Status getStatus() { return status; }
    public String getDeployedBy() { return deployedBy; }
    public String getExecutionLog() { return executionLog; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void setStatus(Status status) { this.status = status; }
    public void setExecutionLog(String executionLog) { this.executionLog = executionLog; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
