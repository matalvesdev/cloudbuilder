package com.cloudbuilder.design.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Comment: A comment anchored to a canvas node or the canvas itself.
 * Supports mentions, resolution, and threading.
 */
@Entity
@Table(name = "canvas_comments", indexes = {
    @Index(name = "idx_comment_canvas", columnList = "canvasId"),
    @Index(name = "idx_comment_node", columnList = "nodeId")
})
public class Comment {

    @Id
    private String id;

    @Column(name = "canvas_id", nullable = false)
    private String canvasId;

    @Column(name = "node_id")
    private String nodeId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "author_id", nullable = false)
    private String authorId;

    @Column(name = "author_name")
    private String authorName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "mention_ids", columnDefinition = "TEXT")
    private String mentionIds;

    @Column(nullable = false)
    private boolean resolved;

    @Column(name = "resolved_by")
    private String resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Comment() {}

    public Comment(String canvasId, String nodeId, String tenantId, String authorId, String authorName, String content) {
        this.id = UUID.randomUUID().toString();
        this.canvasId = canvasId;
        this.nodeId = nodeId;
        this.tenantId = tenantId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.content = content;
        this.resolved = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void resolve(String userId) {
        this.resolved = true;
        this.resolvedBy = userId;
        this.resolvedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void reopen() {
        this.resolved = false;
        this.resolvedBy = null;
        this.resolvedAt = null;
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getCanvasId() { return canvasId; }
    public String getNodeId() { return nodeId; }
    public String getTenantId() { return tenantId; }
    public String getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; this.updatedAt = Instant.now(); }
    public String getMentionIds() { return mentionIds; }
    public void setMentionIds(String mentionIds) { this.mentionIds = mentionIds; }
    public boolean isResolved() { return resolved; }
    public String getResolvedBy() { return resolvedBy; }
    public Instant getResolvedAt() { return resolvedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
