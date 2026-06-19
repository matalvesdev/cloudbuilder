package com.cloudbuilder.observability.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
@Entity
@Table(name = "metrics_ts")
public class MetricsTsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "metric_name", nullable = false, length = 128)
    private String metricName;

    @Column(columnDefinition = "TEXT DEFAULT '{}'")
    private String tags;

    @Column(name = "metric_value", nullable = false)
    private double value;

    @Column(name = "ts", nullable = false)
    private Instant timestamp;

    public MetricsTsEntity() {}

    public MetricsTsEntity(String tenantId, String metricName, String tags, double value, Instant timestamp) {
        this.tenantId = tenantId;
        this.metricName = metricName;
        this.tags = tags;
        this.value = value;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getMetricName() { return metricName; }
    public void setMetricName(String metricName) { this.metricName = metricName; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public double getValue() { return value; }
    public void setValue(double value) { this.value = value; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
