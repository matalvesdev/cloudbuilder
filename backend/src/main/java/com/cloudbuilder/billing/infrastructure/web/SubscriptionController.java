package com.cloudbuilder.billing.infrastructure.web;

import com.cloudbuilder.billing.application.dto.BillingPlanDTO;
import com.cloudbuilder.billing.domain.model.Subscription;
import com.cloudbuilder.billing.domain.service.BillingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/billing/v2")
@PreAuthorize("isAuthenticated()")
public class SubscriptionController {

    private final BillingService billingService;

    public SubscriptionController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/plans")
    public ResponseEntity<List<BillingPlanDTO>> listPlans() {
        return ResponseEntity.ok(
            billingService.getActivePlans().stream()
                .map(BillingPlanDTO::from)
                .toList()
        );
    }

    @GetMapping("/plans/{code}")
    public ResponseEntity<BillingPlanDTO> getPlan(@PathVariable String code) {
        return billingService.getPlanByCode(code)
            .map(BillingPlanDTO::from)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<Map<String, Object>> createSubscription(
            @RequestParam String tenantId,
            @RequestParam String planCode,
            @RequestParam(defaultValue = "MONTHLY") String cycle) {

        Subscription.BillingCycle billingCycle = Subscription.BillingCycle.valueOf(cycle);
        Subscription subscription = billingService.createSubscription(tenantId, planCode, billingCycle);

        Map<String, Object> result = new HashMap<>();
        result.put("id", subscription.getId());
        result.put("status", subscription.getStatus().toString());
        result.put("amount", subscription.getAmount());
        result.put("currency", subscription.getCurrency());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/subscriptions/{tenantId}")
    public ResponseEntity<Map<String, Object>> getSubscription(@PathVariable String tenantId) {
        return billingService.getActiveSubscription(tenantId)
            .map(sub -> {
                Map<String, Object> result = new HashMap<>();
                result.put("id", sub.getId());
                result.put("planId", sub.getPlanId());
                result.put("status", sub.getStatus().toString());
                result.put("amount", sub.getAmount());
                result.put("currency", sub.getCurrency());
                result.put("billingCycle", sub.getBillingCycle().toString());
                return ResponseEntity.ok(result);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/invoices")
    public ResponseEntity<Map<String, Object>> generateInvoice(
            @RequestParam String tenantId,
            @RequestParam String subscriptionId,
            @RequestParam BigDecimal subtotal,
            @RequestParam BigDecimal tax) {

        var invoice = billingService.generateInvoice(tenantId, subscriptionId, subtotal, tax);
        Map<String, Object> result = new HashMap<>();
        result.put("id", invoice.getId());
        result.put("invoiceNumber", invoice.getInvoiceNumber());
        result.put("total", invoice.getTotal());
        result.put("status", invoice.getStatus().toString());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/invoices/{tenantId}")
    public ResponseEntity<List<Map<String, Object>>> listInvoices(
            @PathVariable String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        List<Map<String, Object>> invoices = billingService.getInvoices(tenantId, page, size).stream()
            .map(inv -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", inv.getId());
                map.put("invoiceNumber", inv.getInvoiceNumber());
                map.put("total", inv.getTotal());
                map.put("status", inv.getStatus().toString());
                map.put("dueDate", inv.getDueDate());
                return map;
            })
            .toList();
        return ResponseEntity.ok(invoices);
    }
}
