package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.application.dto.BillingStubDTO;
import com.cloudbuilder.iam.application.dto.BillingStubDTO.UpdateBillingPlanRequest;
import com.cloudbuilder.iam.domain.model.BillingPlan;
import com.cloudbuilder.iam.domain.service.BillingStubService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/billing")
@PreAuthorize("isAuthenticated()")
public class BillingController {

    private final BillingStubService billingStubService;

    public BillingController(BillingStubService billingStubService) {
        this.billingStubService = billingStubService;
    }

    @GetMapping
    public ResponseEntity<BillingStubDTO> getBilling(@PathVariable String organizationId) {
        return billingStubService.getByOrganization(organizationId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<BillingStubDTO> updateBilling(
            @PathVariable String organizationId,
            @RequestBody UpdateBillingPlanRequest req) {
        return ResponseEntity.ok(billingStubService.createOrUpdate(organizationId, req.plan()));
    }

    @PostMapping("/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deactivateBilling(@PathVariable String organizationId) {
        billingStubService.deactivate(organizationId);
        return ResponseEntity.noContent().build();
    }
}
