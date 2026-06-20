package com.cloudbuilder.audit.infrastructure.web;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import com.cloudbuilder.audit.domain.service.AuditQueryService;
import com.cloudbuilder.audit.domain.service.AuditReportExportService;
import com.cloudbuilder.audit.domain.service.AuditService;
import com.cloudbuilder.audit.domain.service.ComplianceService;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit")
@PreAuthorize("isAuthenticated()")
public class AuditController {

    private final AuditService auditService;
    private final AuditQueryService auditQueryService;
    private final AuditReportExportService auditReportExportService;
    private final ComplianceService complianceService;

    public AuditController(AuditService auditService,
                           AuditQueryService auditQueryService,
                           AuditReportExportService auditReportExportService,
                           ComplianceService complianceService) {
        this.auditService = auditService;
        this.auditQueryService = auditQueryService;
        this.auditReportExportService = auditReportExportService;
        this.complianceService = complianceService;
    }

    @GetMapping("/events/{tenantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditEvent>> getEvents(@PathVariable String tenantId) {
        return ResponseEntity.ok(auditService.getEventsByTenant(tenantId));
    }

    @PostMapping("/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuditEvent> recordEvent(@RequestBody RecordEventRequest req) {
        var event = auditService.recordEvent(
                req.tenantId(), req.userId(), req.action(),
                req.resourceType(), req.resourceId(),
                req.details(), req.ipAddress());
        return ResponseEntity.status(HttpStatus.CREATED).body(event);
    }

    // ──────────────────────────────────────────────
    // Query
    // ──────────────────────────────────────────────

    @GetMapping("/query/{tenantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditEvent>> queryEvents(
            @PathVariable String tenantId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var events = auditQueryService.queryEvents(
                tenantId, userId, action, resourceType, startDate, endDate, page, size);
        return ResponseEntity.ok(events);
    }

    // ──────────────────────────────────────────────
    // Export
    // ──────────────────────────────────────────────

    @GetMapping("/export/{tenantId}/csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> exportCsv(
            @PathVariable String tenantId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        String csv = auditReportExportService.exportCsv(tenantId, userId, action, startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit-report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/export/{tenantId}/json")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> exportJson(
            @PathVariable String tenantId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate)
            throws JsonProcessingException {
        String json = auditReportExportService.exportJson(tenantId, userId, action, startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit-report.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(json);
    }

    // ──────────────────────────────────────────────
    // Compliance — Score & Evaluations
    // ──────────────────────────────────────────────

    @GetMapping("/compliance/{tenantId}/score")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getComplianceScore(@PathVariable String tenantId) {
        List<ComplianceEvaluation> evaluations = complianceService.evaluateAll(tenantId);
        long passed = evaluations.stream().filter(ComplianceEvaluation::passed).count();
        int total = evaluations.size();
        double score = total > 0 ? (double) passed / total * 100.0 : 100.0;
        return ResponseEntity.ok(Map.of(
                "score", score,
                "totalRules", total,
                "passedRules", (int) passed));
    }

    @GetMapping("/compliance/{tenantId}/evaluations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ComplianceEvaluation>> getEvaluations(@PathVariable String tenantId) {
        return ResponseEntity.ok(complianceService.evaluateAll(tenantId));
    }

    // ──────────────────────────────────────────────
    // Compliance — Rules CRUD
    // ──────────────────────────────────────────────

    @PostMapping("/compliance/rules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComplianceRule> createRule(@RequestBody CreateRuleRequest req) {
        var rule = complianceService.createRule(
                req.tenantId(), req.name(), req.description(),
                req.category(), req.severity(), req.ruleType(),
                req.configJson(), req.enabled());
        return ResponseEntity.status(HttpStatus.CREATED).body(rule);
    }

    @GetMapping("/compliance/rules/{tenantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ComplianceRule>> getRules(@PathVariable String tenantId) {
        return ResponseEntity.ok(complianceService.getRulesByTenant(tenantId));
    }

    @PutMapping("/compliance/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComplianceRule> updateRule(
            @PathVariable String id,
            @RequestBody UpdateRuleRequest req) {
        return complianceService.updateRule(
                id, req.name(), req.description(), req.category(),
                req.severity(), req.ruleType(), req.configJson(), req.enabled())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/compliance/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRule(@PathVariable String id) {
        complianceService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    // ──────────────────────────────────────────────
    // Request DTOs (inner records)
    // ──────────────────────────────────────────────

    record RecordEventRequest(String tenantId, String userId, String action,
                              String resourceType, String resourceId,
                              String details, String ipAddress) {}

    record CreateRuleRequest(String tenantId, String name, String description,
                             String category, String severity, String ruleType,
                             String configJson, boolean enabled) {}

    record UpdateRuleRequest(String name, String description,
                             String category, String severity, String ruleType,
                             String configJson, boolean enabled) {}
}
