package com.cloudbuilder.observe.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "service_health")
public class ServiceHealth {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String serviceName;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String status;

    private double latencyMs;

    private double uptimePercent;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false, updatable = false)
    private Instant checkedAt;

    protected ServiceHealth() {}

    public ServiceHealth(String serviceName, String environmentId, String status,
                         double latencyMs, double uptimePercent) {
        this.id = UUID.randomUUID();
        this.serviceName = serviceName;
        this.environmentId = environmentId;
        this.status = status;
        this.latencyMs = latencyMs;
        this.uptimePercent = uptimePercent;
        this.checkedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getServiceName() { return serviceName; }
    public String getEnvironmentId() { return environmentId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getLatencyMs() { return latencyMs; }
    public double getUptimePercent() { return uptimePercent; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public Instant getCheckedAt() { return checkedAt; }
}
