package com.cloudbuilder.observability.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
@Entity
@Table(name = "observe_incidents", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"alert_rule_id", "status"})
})
public class IncidentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "alert_rule_id")
    private String alertRuleId;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(nullable = false, length = 256)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 16)
    private String severity;

    @Column(nullable = false, length = 16)
    private String status = "OPEN";

    @Column(name = "current_value")
    private Double currentValue;

    @Column
    private Double threshold;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public IncidentEntity() {}

    public IncidentEntity(String alertRuleId, String tenantId, String title, String description,
                          String severity, Double currentValue, Double threshold) {
        this.alertRuleId = alertRuleId;
        this.tenantId = tenantId;
        this.title = title;
        this.description = description;
        this.severity = severity;
        this.status = "OPEN";
        this.currentValue = currentValue;
        this.threshold = threshold;
        this.startedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAlertRuleId() { return alertRuleId; }
    public void setAlertRuleId(String alertRuleId) { this.alertRuleId = alertRuleId; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getCurrentValue() { return currentValue; }
    public void setCurrentValue(Double currentValue) { this.currentValue = currentValue; }
    public Double getThreshold() { return threshold; }
    public void setThreshold(Double threshold) { this.threshold = threshold; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
