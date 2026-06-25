package com.cloudbuilder.docs.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "doc_auto_links")
public class DocAutoLink {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(name = "source_path", nullable = false)
    private String sourcePath;

    @Column(name = "linked_path", nullable = false)
    private String linkedPath;

    @Column(nullable = false)
    private String relationship;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected DocAutoLink() {}

    public DocAutoLink(String sourcePath, String linkedPath, String relationship, String tenantId) {
        this.id = UUID.randomUUID().toString();
        this.sourcePath = sourcePath;
        this.linkedPath = linkedPath;
        this.relationship = relationship;
        this.tenantId = tenantId;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getSourcePath() { return sourcePath; }
    public void setSourcePath(String sourcePath) { this.sourcePath = sourcePath; }

    public String getLinkedPath() { return linkedPath; }
    public void setLinkedPath(String linkedPath) { this.linkedPath = linkedPath; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
