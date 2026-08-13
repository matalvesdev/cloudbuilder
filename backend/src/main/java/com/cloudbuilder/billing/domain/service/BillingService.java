package com.cloudbuilder.billing.domain.service;

import com.cloudbuilder.billing.domain.model.BillingPlan;
import com.cloudbuilder.billing.domain.model.Invoice;
import com.cloudbuilder.billing.domain.model.Subscription;
import com.cloudbuilder.billing.domain.port.BillingPlanRepository;
import com.cloudbuilder.billing.domain.port.InvoiceRepository;
import com.cloudbuilder.billing.domain.port.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class BillingService {

    private final BillingPlanRepository planRepo;
    private final SubscriptionRepository subscriptionRepo;
    private final InvoiceRepository invoiceRepo;

    public BillingService(BillingPlanRepository planRepo,
                          SubscriptionRepository subscriptionRepo,
                          InvoiceRepository invoiceRepo) {
        this.planRepo = planRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.invoiceRepo = invoiceRepo;
    }

    public List<BillingPlan> getActivePlans() {
        return planRepo.findByActiveTrueOrderBySortOrder();
    }

    public Optional<BillingPlan> getPlanByCode(String code) {
        return planRepo.findByCode(code);
    }

    @Transactional
    public Subscription createSubscription(String tenantId, String planCode,
                                           Subscription.BillingCycle cycle) {
        BillingPlan plan = planRepo.findByCode(planCode)
            .orElseThrow(() -> new RuntimeException("Plan not found: " + planCode));

        BigDecimal amount = cycle == Subscription.BillingCycle.MONTHLY
            ? plan.getMonthlyPrice() : plan.getAnnualPrice();

        Subscription subscription = new Subscription(
            tenantId, plan.getId(), cycle, amount, "BRL"
        );
        return subscriptionRepo.save(subscription);
    }

    public Optional<Subscription> getActiveSubscription(String tenantId) {
        return subscriptionRepo.findByTenantIdAndStatus(tenantId, Subscription.SubscriptionStatus.ACTIVE);
    }

    @Transactional
    public Invoice generateInvoice(String tenantId, String subscriptionId,
                                   BigDecimal subtotal, BigDecimal tax) {
        Subscription subscription = subscriptionRepo.findById(subscriptionId)
            .orElseThrow(() -> new RuntimeException("Subscription not found"));

        String invoiceNumber = String.format("INV-%s-%d",
            tenantId.substring(0, Math.min(8, tenantId.length())),
            System.currentTimeMillis() % 100000);

        BigDecimal total = subtotal.add(tax);
        Instant dueDate = Instant.now().plus(30, ChronoUnit.DAYS);

        Invoice invoice = new Invoice(
            tenantId, subscriptionId, invoiceNumber,
            subtotal, tax, total, "BRL", dueDate
        );
        return invoiceRepo.save(invoice);
    }

    public List<Invoice> getInvoices(String tenantId, int page, int size) {
        return invoiceRepo.findByTenantIdOrderByCreatedAtDesc(
            tenantId, org.springframework.data.domain.PageRequest.of(page, size)
        ).getContent();
    }
}
