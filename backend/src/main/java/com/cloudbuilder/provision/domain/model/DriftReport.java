package com.cloudbuilder.provision.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "drift_reports")
public class DriftReport {

    public static final String STATUS_OPEN = "OPEN";
    public static final String STATUS_RESOLVED = "RESOLVED";
    public static final String STATUS_IGNORED = "IGNORED";

    @Id
    private String id;

    @Column(name = "environment_id", nullable = false)
    private String environmentId;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @Column(name = "drift_details", columnDefinition = "TEXT")
    private String driftDetails;

    @Column(nullable = false)
    private String status;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolved_by")
    private String resolvedBy;

    protected DriftReport() {}

    public DriftReport(String environmentId, String driftDetails) {
        this.id = UUID.randomUUID().toString();
        this.environmentId = environmentId;
        this.detectedAt = Instant.now();
        this.driftDetails = driftDetails;
        this.status = STATUS_OPEN;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEnvironmentId() { return environmentId; }
    public void setEnvironmentId(String environmentId) { this.environmentId = environmentId; }
    public Instant getDetectedAt() { return detectedAt; }
    public void setDetectedAt(Instant detectedAt) { this.detectedAt = detectedAt; }
    public String getDriftDetails() { return driftDetails; }
    public void setDriftDetails(String driftDetails) { this.driftDetails = driftDetails; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }

    public record DriftDetail(
        String resourceAddress,
        String property,
        String expectedValue,
        String actualValue,
        String changeType
    ) {
        public static final String CHANGE_ADDED = "ADDED";
        public static final String CHANGE_REMOVED = "REMOVED";
        public static final String CHANGE_MODIFIED = "MODIFIED";
    }
}
