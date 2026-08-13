package com.cloudbuilder.iam.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * UserNotification: In-app notification for a user.
 */
@Entity
@Table(name = "user_notifications", indexes = {
    @Index(name = "idx_notif_user", columnList = "userId"),
    @Index(name = "idx_notif_read", columnList = "userId,read_flag")
})
public class UserNotification {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "read_flag", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected UserNotification() {}

    public UserNotification(String userId, String tenantId, String title, String message, String type) {
        this.id = UUID.randomUUID().toString();
        this.userId = userId;
        this.tenantId = tenantId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.read = false;
        this.createdAt = Instant.now();
    }

    public void markRead() { this.read = true; }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getTenantId() { return tenantId; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getType() { return type; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    public boolean isRead() { return read; }
    public Instant getCreatedAt() { return createdAt; }
}
