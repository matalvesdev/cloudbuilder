package com.cloudbuilder.cost.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "budgets")
public class Budget {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private double limitAmount;

    @Column(nullable = false)
    private String currency;

    private double spentAmount;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Budget() {}

    public Budget(String environmentId, String name, double limitAmount,
                  String currency, LocalDate startDate, LocalDate endDate) {
        this.id = UUID.randomUUID();
        this.environmentId = environmentId;
        this.name = name;
        this.limitAmount = limitAmount;
        this.currency = currency;
        this.spentAmount = 0;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = "ACTIVE";
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getEnvironmentId() { return environmentId; }
    public String getName() { return name; }
    public double getLimitAmount() { return limitAmount; }
    public String getCurrency() { return currency; }
    public double getSpentAmount() { return spentAmount; }
    public void setSpentAmount(double spentAmount) { this.spentAmount = spentAmount; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getUsagePercent() { return limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0; }
}
