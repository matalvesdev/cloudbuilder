package com.cloudbuilder.aiops.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incidents")
public class Incident {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String classification;

    @Column(columnDefinition = "TEXT")
    private String suggestedRca;

    @Column(nullable = false, updatable = false)
    private Instant detectedAt;

    private Instant resolvedAt;

    protected Incident() {}

    public Incident(String environmentId, String title, String description, String severity) {
        this.id = UUID.randomUUID();
        this.environmentId = environmentId;
        this.title = title;
        this.description = description;
        this.severity = severity;
        this.status = "OPEN";
        this.detectedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getEnvironmentId() { return environmentId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getSeverity() { return severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getClassification() { return classification; }
    public void setClassification(String classification) { this.classification = classification; }
    public String getSuggestedRca() { return suggestedRca; }
    public void setSuggestedRca(String suggestedRca) { this.suggestedRca = suggestedRca; }
    public Instant getDetectedAt() { return detectedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
