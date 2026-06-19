package com.cloudbuilder.docs.domain.model;

import java.time.Instant;
import java.util.UUID;

public class DocMetadata {
    private String id;
    private String tenantId;
    private String path;
    private String title;
    private String summary;
    private String tags;
    private Instant lastModified;
    private String checksum;
    private Instant createdAt;
    private Instant updatedAt;

    public DocMetadata() {}

    public DocMetadata(String tenantId, String path, String title, String summary) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.path = path;
        this.title = title;
        this.summary = summary;
        this.tags = "[]";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public Instant getLastModified() { return lastModified; }
    public void setLastModified(Instant lastModified) { this.lastModified = lastModified; }

    public String getChecksum() { return checksum; }
    public void setChecksum(String checksum) { this.checksum = checksum; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
