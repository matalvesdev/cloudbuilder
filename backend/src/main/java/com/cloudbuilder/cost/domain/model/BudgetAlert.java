package com.cloudbuilder.cost.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "budget_alerts")
public class BudgetAlert {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private double budgetAmount;

    @Column(nullable = false)
    private double currentSpend;

    @Column(nullable = false)
    private String period;

    @Column(nullable = false)
    private String status;

    private double warningThreshold = 0.8;

    private double criticalThreshold = 0.95;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected BudgetAlert() {}

    public BudgetAlert(String tenantId, String name, double budgetAmount,
                       double currentSpend, String period) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.name = name;
        this.budgetAmount = budgetAmount;
        this.currentSpend = currentSpend;
        this.period = period;
        this.warningThreshold = 0.8;
        this.criticalThreshold = 0.95;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        recalculateStatus();
    }

    public void recalculateStatus() {
        if (budgetAmount <= 0) {
            this.status = "OK";
            return;
        }
        double ratio = currentSpend / budgetAmount;
        if (ratio >= 1.0) {
            this.status = "EXCEEDED";
        } else if (ratio >= criticalThreshold) {
            this.status = "CRITICAL";
        } else if (ratio >= warningThreshold) {
            this.status = "WARNING";
        } else {
            this.status = "OK";
        }
    }

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getBudgetAmount() {
        return budgetAmount;
    }

    public void setBudgetAmount(double budgetAmount) {
        this.budgetAmount = budgetAmount;
    }

    public double getCurrentSpend() {
        return currentSpend;
    }

    public void setCurrentSpend(double currentSpend) {
        this.currentSpend = currentSpend;
        recalculateStatus();
        this.updatedAt = LocalDateTime.now();
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public String getStatus() {
        return status;
    }

    public double getWarningThreshold() {
        return warningThreshold;
    }

    public void setWarningThreshold(double warningThreshold) {
        this.warningThreshold = warningThreshold;
    }

    public double getCriticalThreshold() {
        return criticalThreshold;
    }

    public void setCriticalThreshold(double criticalThreshold) {
        this.criticalThreshold = criticalThreshold;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
