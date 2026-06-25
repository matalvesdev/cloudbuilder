package com.cloudbuilder.aiops.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * A runbook containing standard operating procedures for incident response.
 * Runbooks can be searched, suggested for incidents, and applied as remediation.
 */
@Entity
@Table(name = "aiops_runbooks")
public class Runbook {

    public enum Category {
        DATABASE,
        NETWORK,
        SECURITY,
        APPLICATION,
        INFRASTRUCTURE,
        DEPLOYMENT,
        GENERAL
    }

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column(nullable = false)
    private String severity;

    @Column(name = "estimated_duration_minutes")
    private int estimatedDurationMinutes;

    @Column(nullable = false)
    private boolean automated;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Runbook() {}

    public Runbook(String title, String content, String category, String tags, String severity) {
        this.id = UUID.randomUUID().toString();
        this.title = title;
        this.content = content;
        this.category = category;
        this.tags = tags;
        this.severity = severity;
        this.automated = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Runbook(String title, String content, String category, String tags,
                   String severity, int estimatedDurationMinutes, boolean automated) {
        this.id = UUID.randomUUID().toString();
        this.title = title;
        this.content = content;
        this.category = category;
        this.tags = tags;
        this.severity = severity;
        this.estimatedDurationMinutes = estimatedDurationMinutes;
        this.automated = automated;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public int getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(int estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }
    public boolean isAutomated() { return automated; }
    public void setAutomated(boolean automated) { this.automated = automated; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
