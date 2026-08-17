package com.cloudbuilder.billing.domain.service;

import com.cloudbuilder.billing.domain.model.BillingPlan;
import com.cloudbuilder.billing.domain.model.Invoice;
import com.cloudbuilder.billing.domain.model.Subscription;
import com.cloudbuilder.billing.domain.port.BillingPlanRepository;
import com.cloudbuilder.billing.domain.port.InvoiceRepository;
import com.cloudbuilder.billing.domain.port.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillingService Tests")
class BillingServiceTest {

    @Mock
    private BillingPlanRepository planRepo;
    @Mock
    private SubscriptionRepository subscriptionRepo;
    @Mock
    private InvoiceRepository invoiceRepo;

    @InjectMocks
    private BillingService billingService;

    private BillingPlan testPlan;

    @BeforeEach
    void setUp() {
        testPlan = new BillingPlan(
            "PRO", "Professional", "Full access",
            new BigDecimal("99.90"), new BigDecimal("999.00"),
            10, 50, 100, 10000
        );
        // Set the ID via reflection for test
        try {
            var field = com.cloudbuilder.shared.kernel.AggregateRoot.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(testPlan, "plan-001");
        } catch (Exception ignored) {}
    }

    @Test
    @DisplayName("getActivePlans - returns active plans")
    void getActivePlans_returnsActivePlans() {
        BillingPlan freePlan = new BillingPlan(
            "FREE", "Free", "Limited access",
            BigDecimal.ZERO, BigDecimal.ZERO,
            2, 5, 5, 500
        );
        when(planRepo.findByActiveTrueOrderBySortOrder()).thenReturn(List.of(freePlan, testPlan));

        List<BillingPlan> plans = billingService.getActivePlans();

        assertThat(plans).hasSize(2);
        verify(planRepo).findByActiveTrueOrderBySortOrder();
    }

    @Test
    @DisplayName("getActivePlans - returns empty list")
    void getActivePlans_empty() {
        when(planRepo.findByActiveTrueOrderBySortOrder()).thenReturn(List.of());

        List<BillingPlan> plans = billingService.getActivePlans();

        assertThat(plans).isEmpty();
    }

    @Test
    @DisplayName("getPlanByCode - returns plan")
    void getPlanByCode_found() {
        when(planRepo.findByCode("PRO")).thenReturn(Optional.of(testPlan));

        Optional<BillingPlan> plan = billingService.getPlanByCode("PRO");

        assertThat(plan).isPresent();
        assertThat(plan.get().getCode()).isEqualTo("PRO");
    }

    @Test
    @DisplayName("getPlanByCode - returns empty for unknown code")
    void getPlanByCode_notFound() {
        when(planRepo.findByCode("UNKNOWN")).thenReturn(Optional.empty());

        Optional<BillingPlan> plan = billingService.getPlanByCode("UNKNOWN");

        assertThat(plan).isEmpty();
    }

    @Test
    @DisplayName("createSubscription - monthly billing cycle")
    void createSubscription_monthly() {
        when(planRepo.findByCode("PRO")).thenReturn(Optional.of(testPlan));
        when(subscriptionRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Subscription sub = billingService.createSubscription("tenant-1", "PRO", Subscription.BillingCycle.MONTHLY);

        assertThat(sub).isNotNull();
        assertThat(sub.getTenantId()).isEqualTo("tenant-1");
        assertThat(sub.getAmount()).isEqualByComparingTo(new BigDecimal("99.90"));
        assertThat(sub.getCurrency()).isEqualTo("BRL");
        assertThat(sub.getStatus()).isEqualTo(Subscription.SubscriptionStatus.ACTIVE);
        assertThat(sub.getBillingCycle()).isEqualTo(Subscription.BillingCycle.MONTHLY);

        ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepo).save(captor.capture());
        assertThat(captor.getValue().getAmount()).isEqualByComparingTo(new BigDecimal("99.90"));
    }

    @Test
    @DisplayName("createSubscription - annual billing cycle")
    void createSubscription_annual() {
        when(planRepo.findByCode("PRO")).thenReturn(Optional.of(testPlan));
        when(subscriptionRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Subscription sub = billingService.createSubscription("tenant-1", "PRO", Subscription.BillingCycle.ANNUAL);

        assertThat(sub.getAmount()).isEqualByComparingTo(new BigDecimal("999.00"));
        assertThat(sub.getBillingCycle()).isEqualTo(Subscription.BillingCycle.ANNUAL);
    }

    @Test
    @DisplayName("createSubscription - throws when plan not found")
    void createSubscription_planNotFound() {
        when(planRepo.findByCode("NONEXISTENT")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.createSubscription("tenant-1", "NONEXISTENT", Subscription.BillingCycle.MONTHLY))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Plan not found");
    }

    @Test
    @DisplayName("getActiveSubscription - returns active subscription")
    void getActiveSubscription_found() {
        Subscription sub = new Subscription("tenant-1", "plan-001", Subscription.BillingCycle.MONTHLY,
            new BigDecimal("99.90"), "BRL");
        when(subscriptionRepo.findByTenantIdAndStatus("tenant-1", Subscription.SubscriptionStatus.ACTIVE))
            .thenReturn(Optional.of(sub));

        Optional<Subscription> result = billingService.getActiveSubscription("tenant-1");

        assertThat(result).isPresent();
        assertThat(result.get().getTenantId()).isEqualTo("tenant-1");
    }

    @Test
    @DisplayName("getActiveSubscription - returns empty when none")
    void getActiveSubscription_empty() {
        when(subscriptionRepo.findByTenantIdAndStatus("tenant-1", Subscription.SubscriptionStatus.ACTIVE))
            .thenReturn(Optional.empty());

        Optional<Subscription> result = billingService.getActiveSubscription("tenant-1");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("generateInvoice - creates invoice with correct total")
    void generateInvoice_createsCorrectInvoice() {
        Subscription sub = new Subscription("tenant-1", "plan-001", Subscription.BillingCycle.MONTHLY,
            new BigDecimal("99.90"), "BRL");
        when(subscriptionRepo.findById("sub-1")).thenReturn(Optional.of(sub));
        when(invoiceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Invoice invoice = billingService.generateInvoice("tenant-1", "sub-1",
            new BigDecimal("100.00"), new BigDecimal("18.00"));

        assertThat(invoice).isNotNull();
        assertThat(invoice.getTenantId()).isEqualTo("tenant-1");
        assertThat(invoice.getTotal()).isEqualByComparingTo(new BigDecimal("118.00"));
        assertThat(invoice.getStatus()).isEqualTo(Invoice.InvoiceStatus.OPEN);
        assertThat(invoice.getDueDate()).isAfter(Instant.now().minus(1, ChronoUnit.DAYS));
    }

    @Test
    @DisplayName("generateInvoice - throws when subscription not found")
    void generateInvoice_subscriptionNotFound() {
        when(subscriptionRepo.findById("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.generateInvoice("tenant-1", "nonexistent",
            BigDecimal.TEN, BigDecimal.ONE))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Subscription not found");
    }

    @Test
    @DisplayName("getInvoices - returns paginated invoices")
    void getInvoices_returnsPaged() {
        Invoice inv1 = new Invoice("tenant-1", "sub-1", "INV-001",
            BigDecimal.TEN, BigDecimal.ONE, new BigDecimal("11"), "BRL", Instant.now());
        var page = new org.springframework.data.domain.PageImpl<>(List.of(inv1));
        when(invoiceRepo.findByTenantIdOrderByCreatedAtDesc("tenant-1",
            org.springframework.data.domain.PageRequest.of(0, 10))).thenReturn(page);

        List<Invoice> invoices = billingService.getInvoices("tenant-1", 0, 10);

        assertThat(invoices).hasSize(1);
        assertThat(invoices.get(0).getInvoiceNumber()).isEqualTo("INV-001");
    }
}
