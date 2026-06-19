package com.cloudbuilder.docs.domain.model;

import java.time.Instant;
import java.util.UUID;

public class DocAutoLink {
    private String id;
    private String docPath;
    private String entityType;
    private String entityId;
    private String tenantId;
    private Instant lastSync;
    private Instant createdAt;

    public DocAutoLink() {}

    public DocAutoLink(String docPath, String entityType, String entityId, String tenantId) {
        this.id = UUID.randomUUID().toString();
        this.docPath = docPath;
        this.entityType = entityType;
        this.entityId = entityId;
        this.tenantId = tenantId;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDocPath() { return docPath; }
    public void setDocPath(String docPath) { this.docPath = docPath; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public Instant getLastSync() { return lastSync; }
    public void setLastSync(Instant lastSync) { this.lastSync = lastSync; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
