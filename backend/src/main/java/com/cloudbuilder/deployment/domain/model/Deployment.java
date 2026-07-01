package com.cloudbuilder.deployment.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deployments")
public class Deployment {

    /**
     * @deprecated Use {@link DeploymentState} instead. Kept for backward compatibility.
     */
    @Deprecated
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

    /**
     * @deprecated Use {@link #lifecycleState} instead.
     */
    @Deprecated
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    /**
     * Current lifecycle state managed by DeploymentStateMachine.
     * Replaces the legacy Status enum with a validated state machine.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DeploymentState lifecycleState;

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
        this.lifecycleState = DeploymentState.REQUESTED;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getEnvironmentId() { return environmentId; }
    public String getCanvasDesignId() { return canvasDesignId; }
    public String getVersion() { return version; }
    @Deprecated public Status getStatus() { return status; }
    public DeploymentState getLifecycleState() { return lifecycleState; }
    public String getDeployedBy() { return deployedBy; }
    public String getExecutionLog() { return executionLog; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }

    @Deprecated public void setStatus(Status status) { this.status = status; }
    public void setLifecycleState(DeploymentState lifecycleState) { this.lifecycleState = lifecycleState; }
    public void setExecutionLog(String executionLog) { this.executionLog = executionLog; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
