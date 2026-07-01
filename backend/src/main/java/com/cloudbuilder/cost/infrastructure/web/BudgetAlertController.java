package com.cloudbuilder.cost.infrastructure.web;

import com.cloudbuilder.cost.domain.model.BudgetAlert;
import com.cloudbuilder.cost.domain.service.BudgetAlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budget-alerts")
@PreAuthorize("isAuthenticated()")
public class BudgetAlertController {

    private final BudgetAlertService budgetAlertService;

    public BudgetAlertController(BudgetAlertService budgetAlertService) {
        this.budgetAlertService = budgetAlertService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BudgetAlert> create(@RequestBody BudgetAlert alert) {
        return ResponseEntity.ok(budgetAlertService.create(alert));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BudgetAlert> getById(@PathVariable String id) {
        return budgetAlertService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<BudgetAlert>> getAll(@RequestParam(defaultValue = "default") String tenantId) {
        return ResponseEntity.ok(budgetAlertService.findByTenantId(tenantId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BudgetAlert> update(@PathVariable String id, @RequestBody BudgetAlert alert) {
        return budgetAlertService.update(id, alert)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        budgetAlertService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check")
    public ResponseEntity<List<BudgetAlert>> checkAlerts() {
        var updated = budgetAlertService.checkAlerts();
        return ResponseEntity.ok(updated);
    }
}
