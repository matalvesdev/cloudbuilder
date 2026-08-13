package com.cloudbuilder.billing.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "billing_plans")
public class BillingPlan extends AggregateRoot {

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal monthlyPrice;

    @Column(nullable = false)
    private BigDecimal annualPrice;

    @Column(nullable = false)
    private int maxUsers;

    @Column(nullable = false)
    private int maxProjects;

    @Column(nullable = false)
    private int maxDeploymentsPerMonth;

    @Column(nullable = false)
    private long maxResources;

    @Column(columnDefinition = "TEXT")
    private String featuresJson;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private int sortOrder;

    protected BillingPlan() {}

    public BillingPlan(String code, String name, String description,
                       BigDecimal monthlyPrice, BigDecimal annualPrice,
                       int maxUsers, int maxProjects, int maxDeploymentsPerMonth, long maxResources) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.monthlyPrice = monthlyPrice;
        this.annualPrice = annualPrice;
        this.maxUsers = maxUsers;
        this.maxProjects = maxProjects;
        this.maxDeploymentsPerMonth = maxDeploymentsPerMonth;
        this.maxResources = maxResources;
        this.active = true;
        this.sortOrder = 0;
    }

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getMonthlyPrice() { return monthlyPrice; }
    public BigDecimal getAnnualPrice() { return annualPrice; }
    public int getMaxUsers() { return maxUsers; }
    public int getMaxProjects() { return maxProjects; }
    public int getMaxDeploymentsPerMonth() { return maxDeploymentsPerMonth; }
    public long getMaxResources() { return maxResources; }
    public boolean isActive() { return active; }
}
