package com.cloudbuilder.docs.application.dto;

public class DocLinkRequest {
    private String sourcePath;
    private String linkedPath;
    private String relationship;
    private String tenantId;

    public DocLinkRequest() {}

    public String getSourcePath() { return sourcePath; }
    public void setSourcePath(String sourcePath) { this.sourcePath = sourcePath; }

    public String getLinkedPath() { return linkedPath; }
    public void setLinkedPath(String linkedPath) { this.linkedPath = linkedPath; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
