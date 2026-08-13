package com.cloudbuilder.cost.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Persisted cost anomaly result.
 * Detected by AnomalyDetectionService whenever a cost record deviates
 * significantly from the 7-day moving average.
 */
@Entity
@Table(name = "cost_anomaly_results")
public class CostAnomalyResult {

    @Id
    private String id;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String serviceName;

    @Column(nullable = false)
    private LocalDate anomalyDate;

    @Column(nullable = false)
    private double actualAmount;

    @Column(nullable = false)
    private double expectedAmount;

    @Column(nullable = false)
    private double deviationPct;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false, updatable = false)
    private Instant detectedAt;

    private Instant resolvedAt;

    protected CostAnomalyResult() {}

    public CostAnomalyResult(String environmentId, String serviceName, LocalDate anomalyDate,
                             double actualAmount, double expectedAmount,
                             double deviationPct, String severity) {
        this.id = UUID.randomUUID().toString();
        this.environmentId = environmentId;
        this.serviceName = serviceName;
        this.anomalyDate = anomalyDate;
        this.actualAmount = actualAmount;
        this.expectedAmount = expectedAmount;
        this.deviationPct = deviationPct;
        this.severity = severity;
        this.status = "OPEN";
        this.detectedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getEnvironmentId() { return environmentId; }
    public String getServiceName() { return serviceName; }
    public LocalDate getAnomalyDate() { return anomalyDate; }
    public double getActualAmount() { return actualAmount; }
    public double getExpectedAmount() { return expectedAmount; }
    public double getDeviationPct() { return deviationPct; }
    public String getSeverity() { return severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public Instant getDetectedAt() { return detectedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
