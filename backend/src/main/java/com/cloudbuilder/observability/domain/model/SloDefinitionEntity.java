package com.cloudbuilder.observability.domain.model;

import jakarta.persistence.*;
@Entity
@Table(name = "slo_definitions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "name"})
})
public class SloDefinitionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "sli_type", nullable = false, length = 32)
    private String sliType;

    @Column(name = "metric_name", nullable = false, length = 128)
    private String metricName;

    @Column(name = "target_pct", nullable = false)
    private double targetPct;

    @Column(name = "window_days", nullable = false)
    private int windowDays = 30;

    @Column(nullable = false)
    private boolean enabled = true;

    public SloDefinitionEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSliType() { return sliType; }
    public void setSliType(String sliType) { this.sliType = sliType; }
    public String getMetricName() { return metricName; }
    public void setMetricName(String metricName) { this.metricName = metricName; }
    public double getTargetPct() { return targetPct; }
    public void setTargetPct(double targetPct) { this.targetPct = targetPct; }
    public int getWindowDays() { return windowDays; }
    public void setWindowDays(int windowDays) { this.windowDays = windowDays; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
