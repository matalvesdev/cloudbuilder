package com.cloudbuilder.cost.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cost_optimization_suggestions")
public class CostOptimizationSuggestion {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String resourceType;

    @Column(nullable = false)
    private String resourceId;

    @Column(nullable = false)
    private String resourceName;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String suggestion;

    @Column(nullable = false)
    private double currentCost;

    @Column(nullable = false)
    private double estimatedCost;

    @Column(nullable = false)
    private double savings;

    @Column(nullable = false)
    private double savingsPercent;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    private boolean applied;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant appliedAt;

    protected CostOptimizationSuggestion() {}

    public CostOptimizationSuggestion(String tenantId, String environmentId, String resourceType,
                                      String resourceId, String resourceName, String provider,
                                      String suggestion, double currentCost, double estimatedCost,
                                      String severity) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.environmentId = environmentId;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.provider = provider;
        this.suggestion = suggestion;
        this.currentCost = currentCost;
        this.estimatedCost = estimatedCost;
        this.savings = currentCost - estimatedCost;
        this.savingsPercent = currentCost > 0 ? Math.round((this.savings / currentCost) * 100.0 * 10.0) / 10.0 : 0;
        this.severity = severity;
        this.applied = false;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getEnvironmentId() { return environmentId; }
    public String getResourceType() { return resourceType; }
    public String getResourceId() { return resourceId; }
    public String getResourceName() { return resourceName; }
    public String getProvider() { return provider; }
    public String getSuggestion() { return suggestion; }
    public double getCurrentCost() { return currentCost; }
    public double getEstimatedCost() { return estimatedCost; }
    public double getSavings() { return savings; }
    public double getSavingsPercent() { return savingsPercent; }
    public String getSeverity() { return severity; }
    public boolean isApplied() { return applied; }
    public void setApplied(boolean applied) {
        this.applied = applied;
        if (applied) {
            this.appliedAt = Instant.now();
        }
    }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getAppliedAt() { return appliedAt; }
}
