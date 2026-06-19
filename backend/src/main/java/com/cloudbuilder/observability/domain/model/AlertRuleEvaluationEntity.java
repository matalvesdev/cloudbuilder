package com.cloudbuilder.observability.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
@Entity
@Table(name = "alert_rule_evaluations")
public class AlertRuleEvaluationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "alert_rule_id", nullable = false)
    private String alertRuleId;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "evaluated_at", nullable = false)
    private Instant evaluatedAt;

    @Column(name = "current_value")
    private Double currentValue;

    @Column
    private Double threshold;

    @Column(nullable = false)
    private boolean breached;

    public AlertRuleEvaluationEntity() {}

    public AlertRuleEvaluationEntity(String alertRuleId, String tenantId, Instant evaluatedAt,
                                     Double currentValue, Double threshold, boolean breached) {
        this.alertRuleId = alertRuleId;
        this.tenantId = tenantId;
        this.evaluatedAt = evaluatedAt;
        this.currentValue = currentValue;
        this.threshold = threshold;
        this.breached = breached;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAlertRuleId() { return alertRuleId; }
    public void setAlertRuleId(String alertRuleId) { this.alertRuleId = alertRuleId; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public Instant getEvaluatedAt() { return evaluatedAt; }
    public void setEvaluatedAt(Instant evaluatedAt) { this.evaluatedAt = evaluatedAt; }
    public Double getCurrentValue() { return currentValue; }
    public void setCurrentValue(Double currentValue) { this.currentValue = currentValue; }
    public Double getThreshold() { return threshold; }
    public void setThreshold(Double threshold) { this.threshold = threshold; }
    public boolean isBreached() { return breached; }
    public void setBreached(boolean breached) { this.breached = breached; }
}
