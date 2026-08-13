package com.cloudbuilder.notification.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notifications")
public class Notification extends AggregateRoot {

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationChannel channel;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(columnDefinition = "TEXT")
    private String metadataJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @Column
    private Instant sentAt;

    @Column
    private Instant readAt;

    @Column
    private String templateId;

    @Column(columnDefinition = "TEXT")
    private String templateDataJson;

    protected Notification() {}

    public Notification(String tenantId, String userId, NotificationType type,
                       NotificationChannel channel, String title, String body) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.type = type;
        this.channel = channel;
        this.title = title;
        this.body = body;
        this.status = NotificationStatus.PENDING;
    }

    public void markSent() { this.status = NotificationStatus.SENT; this.sentAt = Instant.now(); }
    public void markRead() { this.status = NotificationStatus.READ; this.readAt = Instant.now(); }
    public void markFailed(String error) {
        this.status = NotificationStatus.FAILED;
        this.metadataJson = "{\"error\":\"" + error + "\"}";
    }

    public String getTenantId() { return tenantId; }
    public String getUserId() { return userId; }
    public NotificationType getType() { return type; }
    public NotificationChannel getChannel() { return channel; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public NotificationStatus getStatus() { return status; }
    public Instant getSentAt() { return sentAt; }
    public Instant getReadAt() { return readAt; }
    public String getTemplateId() { return templateId; }

    public void setTemplateId(String templateId) { this.templateId = templateId; }
    public void setTemplateDataJson(String data) { this.templateDataJson = data; }
    public void setMetadataJson(String json) { this.metadataJson = json; }

    public enum NotificationType {
        DEPLOYMENT_STARTED, DEPLOYMENT_COMPLETED, DEPLOYMENT_FAILED,
        DEPLOYMENT_APPROVAL, DRIFT_DETECTED, INCIDENT_CREATED,
        INCIDENT_RESOLVED, COST_ALERT, SECURITY_ALERT, SYSTEM
    }

    public enum NotificationChannel {
        EMAIL, SLACK, DISCORD, TEAMS, WEBHOOK, PUSH, IN_APP
    }

    public enum NotificationStatus {
        PENDING, SENT, DELIVERED, READ, FAILED
    }
}
