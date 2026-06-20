package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import com.cloudbuilder.audit.domain.port.ComplianceRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComplianceService {

    private final ComplianceRuleRepository ruleRepository;
    private final AuditEventRepository auditEventRepository;

    public ComplianceService(ComplianceRuleRepository ruleRepository,
                             AuditEventRepository auditEventRepository) {
        this.ruleRepository = ruleRepository;
        this.auditEventRepository = auditEventRepository;
    }

    @Transactional(readOnly = true)
    public List<ComplianceEvaluation> evaluateAll(String tenantId) {
        List<ComplianceRule> rules = ruleRepository.findByTenantIdAndEnabledTrue(tenantId);
        List<ComplianceEvaluation> evaluations = new ArrayList<>();

        for (ComplianceRule rule : rules) {
            evaluations.add(evaluateRuleAgainstAudit(rule));
        }

        return evaluations.stream()
                .sorted(Comparator.comparing(ComplianceEvaluation::severity)
                        .thenComparing(ComplianceEvaluation::ruleName))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ComplianceEvaluation evaluateRule(String tenantId, String ruleId) {
        ComplianceRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("Compliance rule not found: " + ruleId));

        if (!rule.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Rule does not belong to tenant: " + tenantId);
        }

        return evaluateRuleAgainstAudit(rule);
    }

    @Transactional(readOnly = true)
    public double getComplianceScore(String tenantId) {
        List<ComplianceRule> rules = ruleRepository.findByTenantIdAndEnabledTrue(tenantId);

        if (rules.isEmpty()) {
            return 100.0;
        }

        long passed = 0;
        for (ComplianceRule rule : rules) {
            ComplianceEvaluation eval = evaluateRuleAgainstAudit(rule);
            if (eval.passed()) {
                passed++;
            }
        }

        return (double) passed / rules.size() * 100.0;
    }

    public ComplianceRule createRule(String tenantId, String name, String description,
                                     String category, String severity, String ruleType,
                                     String configJson, boolean enabled) {
        ComplianceRule rule = new ComplianceRule(tenantId, name, description,
                category, severity, ruleType, configJson, enabled);
        return ruleRepository.save(rule);
    }

    public Optional<ComplianceRule> updateRule(String ruleId, String name, String description,
                                               String category, String severity, String ruleType,
                                               String configJson, boolean enabled) {
        return ruleRepository.findById(ruleId).map(rule -> {
            rule.update(name, description, category, severity, ruleType, configJson, enabled);
            return ruleRepository.save(rule);
        });
    }

    @Transactional(readOnly = true)
    public List<ComplianceRule> getRulesByTenant(String tenantId) {
        return ruleRepository.findByTenantId(tenantId);
    }

    public void deleteRule(String ruleId) {
        ruleRepository.deleteById(ruleId);
    }

    @SuppressWarnings("null")
    private ComplianceEvaluation evaluateRuleAgainstAudit(ComplianceRule rule) {
        Instant now = Instant.now();

        // AUDIT_PATTERN: Check if matching audit events exist
        if ("AUDIT_PATTERN".equals(rule.getRuleType())) {

            if (rule.getConfigJson() == null || rule.getConfigJson().isBlank()) {
                return new ComplianceEvaluation(
                        rule.getId(), rule.getName(), rule.getCategory(),
                        rule.getSeverity(), false,
                        "Rule has no configuration pattern defined", now);
            }

            String pattern = rule.getConfigJson().replaceAll("[\"{}\\s]", "").toLowerCase();
            List<AuditEvent> events = auditEventRepository.findByTenantIdOrderByTimestampDesc(rule.getTenantId());

            boolean found = events.stream().anyMatch(event ->
                    (pattern.contains("action:") && event.getAction().toLowerCase().contains(
                            extractPatternValue(pattern, "action:")))
                    || (pattern.contains("resourceType:") && event.getResourceType().toLowerCase().contains(
                            extractPatternValue(pattern, "resourceType:")))
                    || (!pattern.contains("action:") && !pattern.contains("resourceType:"))
            );

            String message = found
                    ? "Audit pattern matched in recent events"
                    : "No matching audit events found for pattern";

            return new ComplianceEvaluation(
                    rule.getId(), rule.getName(), rule.getCategory(),
                    rule.getSeverity(), found, message, now);
        }

        // COST_THRESHOLD and RESOURCE_CONSTRAINT default to "not evaluated" via audit data
        return new ComplianceEvaluation(
                rule.getId(), rule.getName(), rule.getCategory(),
                rule.getSeverity(), true,
                "Rule type '" + rule.getRuleType() + "' requires external data source for evaluation",
                now);
    }

    private String extractPatternValue(String configJson, String prefix) {
        int idx = configJson.indexOf(prefix);
        if (idx < 0) return "";
        String after = configJson.substring(idx + prefix.length());
        int commaIdx = after.indexOf(",");
        int endIdx = after.indexOf("}");
        int stopIdx = -1;
        if (commaIdx >= 0 && endIdx >= 0) {
            stopIdx = Math.min(commaIdx, endIdx);
        } else if (commaIdx >= 0) {
            stopIdx = commaIdx;
        } else if (endIdx >= 0) {
            stopIdx = endIdx;
        }
        return (stopIdx >= 0) ? after.substring(0, stopIdx).trim() : after.trim();
    }
}
