package com.cloudbuilder.docs.application.dto;

public class DocLinkRequest {
    private String docPath;
    private String entityType;
    private String entityId;
    private String tenantId;

    public DocLinkRequest() {}

    public String getDocPath() { return docPath; }
    public void setDocPath(String docPath) { this.docPath = docPath; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
