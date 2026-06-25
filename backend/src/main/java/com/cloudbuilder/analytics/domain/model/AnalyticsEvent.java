package com.cloudbuilder.analytics.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "analytics_events")
public class AnalyticsEvent {

    @Id
    private String id;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String module;

    @Column(nullable = false)
    private String action;

    private String resourceType;

    private String resourceId;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    private String sessionId;

    protected AnalyticsEvent() {}

    public AnalyticsEvent(String eventType, String userId, String tenantId,
                          String module, String action) {
        this.id = UUID.randomUUID().toString();
        this.eventType = eventType;
        this.userId = userId;
        this.tenantId = tenantId;
        this.module = module;
        this.action = action;
        this.timestamp = Instant.now();
    }

    public String getId() { return id; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getUserId() { return userId; }
    public String getTenantId() { return tenantId; }
    public String getModule() { return module; }
    public String getAction() { return action; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    public Instant getTimestamp() { return timestamp; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
}
