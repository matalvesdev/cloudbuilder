package com.cloudbuilder.billing.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "subscriptions")
public class Subscription extends AggregateRoot {

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String planId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillingCycle billingCycle;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column
    private Instant currentPeriodStart;

    @Column
    private Instant currentPeriodEnd;

    @Column
    private Instant canceledAt;

    @Column
    private String stripeSubscriptionId;

    @Column
    private String stripeCustomerId;

    protected Subscription() {}

    public Subscription(String tenantId, String planId, BillingCycle billingCycle,
                       BigDecimal amount, String currency) {
        this.tenantId = tenantId;
        this.planId = planId;
        this.status = SubscriptionStatus.ACTIVE;
        this.billingCycle = billingCycle;
        this.amount = amount;
        this.currency = currency;
        this.currentPeriodStart = Instant.now();
    }

    public void cancel() { this.status = SubscriptionStatus.CANCELED; this.canceledAt = Instant.now(); }
    public void suspend() { this.status = SubscriptionStatus.SUSPENDED; }
    public void reactivate() { this.status = SubscriptionStatus.ACTIVE; }

    public String getTenantId() { return tenantId; }
    public String getPlanId() { return planId; }
    public SubscriptionStatus getStatus() { return status; }
    public BillingCycle getBillingCycle() { return billingCycle; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public Instant getCurrentPeriodStart() { return currentPeriodStart; }
    public Instant getCurrentPeriodEnd() { return currentPeriodEnd; }

    public enum SubscriptionStatus {
        ACTIVE, SUSPENDED, CANCELED, PAST_DUE, TRIALING
    }

    public enum BillingCycle {
        MONTHLY, ANNUAL
    }
}
