package com.cloudbuilder.aiops.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "diagnosis_results")
public class DiagnosisResult {

    @Id
    private String id;

    @Column(nullable = false)
    private String incidentId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String rootCause;

    @Column(nullable = false)
    private String confidence;

    @Column(nullable = false)
    private String severity;

    @Column(columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(columnDefinition = "TEXT")
    private String affectedResources;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected DiagnosisResult() {}

    public DiagnosisResult(String incidentId, String rootCause, String confidence,
                           String severity, String status) {
        this.id = UUID.randomUUID().toString();
        this.incidentId = incidentId;
        this.rootCause = rootCause;
        this.confidence = confidence;
        this.severity = severity;
        this.status = status;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getIncidentId() { return incidentId; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public String getConfidence() { return confidence; }
    public void setConfidence(String confidence) { this.confidence = confidence; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }
    public String getAffectedResources() { return affectedResources; }
    public void setAffectedResources(String affectedResources) { this.affectedResources = affectedResources; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
