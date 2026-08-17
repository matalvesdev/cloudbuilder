package com.cloudbuilder.audit.infrastructure.web;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import com.cloudbuilder.audit.domain.service.ComplianceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for compliance rule management and evaluation.
 * <p>
 * Implements the Policy-as-Code (ADR-020) API layer.
 * Integrates both Java-based evaluators and OPA-sidecar evaluation.
 */
@RestController
@RequestMapping("/api/v1/compliance")
public class ComplianceController {

    private final ComplianceService complianceService;

    public ComplianceController(ComplianceService complianceService) {
        this.complianceService = complianceService;
    }

    /**
     * Evaluate all active compliance rules for a tenant.
     */
    @GetMapping("/evaluate/{tenantId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<List<ComplianceEvaluation>> evaluateAll(@PathVariable String tenantId) {
        List<ComplianceEvaluation> evaluations = complianceService.evaluateAll(tenantId);
        return ResponseEntity.ok(evaluations);
    }

    /**
     * Evaluate a specific compliance rule for a tenant.
     */
    @GetMapping("/evaluate/{tenantId}/rule/{ruleId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ComplianceEvaluation> evaluateRule(
            @PathVariable String tenantId,
            @PathVariable String ruleId) {
        ComplianceEvaluation evaluation = complianceService.evaluateRule(tenantId, ruleId);
        return ResponseEntity.ok(evaluation);
    }

    /**
     * Get the overall compliance score (0-100) for a tenant.
     */
    @GetMapping("/score/{tenantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getScore(@PathVariable String tenantId) {
        double score = complianceService.getComplianceScore(tenantId);
        return ResponseEntity.ok(Map.of(
            "tenantId", tenantId,
            "score", score,
            "status", score >= 80 ? "good" : score >= 50 ? "warning" : "critical"
        ));
    }

    /**
     * List all compliance rules for a tenant.
     */
    @GetMapping("/rules/{tenantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ComplianceRule>> getRules(@PathVariable String tenantId) {
        List<ComplianceRule> rules = complianceService.getRulesByTenant(tenantId);
        return ResponseEntity.ok(rules);
    }

    /**
     * Create a new compliance rule.
     */
    @PostMapping("/rules/{tenantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComplianceRule> createRule(
            @PathVariable String tenantId,
            @RequestBody CreateRuleRequest request) {
        ComplianceRule rule = complianceService.createRule(
            tenantId, request.name(), request.description(),
            request.category(), request.severity(), request.ruleType(),
            request.configJson(), request.enabled());
        return ResponseEntity.status(HttpStatus.CREATED).body(rule);
    }

    /**
     * Update an existing compliance rule.
     */
    @PutMapping("/rules/{ruleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComplianceRule> updateRule(
            @PathVariable String ruleId,
            @RequestBody CreateRuleRequest request) {
        var updated = complianceService.updateRule(
            ruleId, request.name(), request.description(),
            request.category(), request.severity(), request.ruleType(),
            request.configJson(), request.enabled());
        return updated.map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a compliance rule.
     */
    @DeleteMapping("/rules/{ruleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRule(@PathVariable String ruleId) {
        complianceService.deleteRule(ruleId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Check if OPA sidecar is reachable.
     */
    @GetMapping("/opa/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> opaStatus() {
        boolean reachable = complianceService.isOpaReachable();
        return ResponseEntity.ok(Map.of(
            "opaEnabled", true,
            "reachable", reachable,
            "message", reachable
                ? "OPA sidecar está acessível"
                : "OPA sidecar não está acessível — usando fallback Java"
        ));
    }

    public record CreateRuleRequest(
        String name,
        String description,
        String category,
        String severity,
        String ruleType,
        String configJson,
        boolean enabled
    ) {}
}
