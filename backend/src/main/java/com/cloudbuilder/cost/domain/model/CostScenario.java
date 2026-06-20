package com.cloudbuilder.cost.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * What-if Cost Scenario — persiste simulações de custo do canvas.
 * Cada cenário captura a configuração de nós, estimativas por categoria
 * e o resultado da simulação para comparação futura.
 */
@Entity
@Table(name = "cost_scenarios")
public class CostScenario {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String canvasId;

    @Column(nullable = false)
    private String tier; // min, avg, max

    private double currentTotal;

    private double proposedTotal;

    private int resourceCount;

    @Column(columnDefinition = "TEXT")
    private String breakdownJson; // JSON array of category breakdown

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    protected CostScenario() {}

    public CostScenario(String tenantId, String name, String environmentId, String canvasId,
                        String tier, double currentTotal, double proposedTotal,
                        int resourceCount, String breakdownJson) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.name = name;
        this.environmentId = environmentId;
        this.canvasId = canvasId;
        this.tier = tier;
        this.currentTotal = currentTotal;
        this.proposedTotal = proposedTotal;
        this.resourceCount = resourceCount;
        this.breakdownJson = breakdownJson;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getEnvironmentId() { return environmentId; }
    public String getCanvasId() { return canvasId; }
    public String getTier() { return tier; }
    public double getCurrentTotal() { return currentTotal; }
    public double getProposedTotal() { return proposedTotal; }
    public int getResourceCount() { return resourceCount; }
    public String getBreakdownJson() { return breakdownJson; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
