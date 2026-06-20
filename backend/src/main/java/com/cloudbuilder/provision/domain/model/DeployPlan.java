package com.cloudbuilder.provision.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Deploy Plan — persiste o resultado de previews de deploy (plan).
 * Armazena a contagem de add/change/destroy e o JSON de recursos
 * para comparação e auditoria.
 */
@Entity
@Table(name = "deploy_plans")
public class DeployPlan {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String canvasId;

    @Column(nullable = false)
    private int addCount;

    @Column(nullable = false)
    private int changeCount;

    @Column(nullable = false)
    private int destroyCount;

    @Column(columnDefinition = "TEXT")
    private String resourcesJson; // JSON array of {resourceType, name, action, details}

    @Column(nullable = false)
    private String status; // planned, applied, failed

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant appliedAt;

    protected DeployPlan() {}

    public DeployPlan(String tenantId, String environmentId, String canvasId,
                      int addCount, int changeCount, int destroyCount,
                      String resourcesJson) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.environmentId = environmentId;
        this.canvasId = canvasId;
        this.addCount = addCount;
        this.changeCount = changeCount;
        this.destroyCount = destroyCount;
        this.resourcesJson = resourcesJson;
        this.status = "planned";
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getEnvironmentId() { return environmentId; }
    public String getCanvasId() { return canvasId; }
    public int getAddCount() { return addCount; }
    public int getChangeCount() { return changeCount; }
    public int getDestroyCount() { return destroyCount; }
    public String getResourcesJson() { return resourcesJson; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getAppliedAt() { return appliedAt; }
    public void setAppliedAt(Instant appliedAt) { this.appliedAt = appliedAt; }
}
