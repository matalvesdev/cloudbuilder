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
    private String id = UUID.randomUUID().toString();

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
    private String status = "planned"; // planned, applied, failed

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant appliedAt;

    protected DeployPlan() {
    }

    public DeployPlan(String tenantId, String environmentId, String canvasId,
                      int addCount, int changeCount, int destroyCount,
                      String resourcesJson) {
        this.tenantId = tenantId;
        this.environmentId = environmentId;
        this.canvasId = canvasId;
        this.addCount = addCount;
        this.changeCount = changeCount;
        this.destroyCount = destroyCount;
        this.resourcesJson = resourcesJson;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getEnvironmentId() { return environmentId; }
    public void setEnvironmentId(String environmentId) { this.environmentId = environmentId; }
    public String getCanvasId() { return canvasId; }
    public void setCanvasId(String canvasId) { this.canvasId = canvasId; }
    public int getAddCount() { return addCount; }
    public void setAddCount(int addCount) { this.addCount = addCount; }
    public int getChangeCount() { return changeCount; }
    public void setChangeCount(int changeCount) { this.changeCount = changeCount; }
    public int getDestroyCount() { return destroyCount; }
    public void setDestroyCount(int destroyCount) { this.destroyCount = destroyCount; }
    public String getResourcesJson() { return resourcesJson; }
    public void setResourcesJson(String resourcesJson) { this.resourcesJson = resourcesJson; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getAppliedAt() { return appliedAt; }
    public void setAppliedAt(Instant appliedAt) { this.appliedAt = appliedAt; }
}
