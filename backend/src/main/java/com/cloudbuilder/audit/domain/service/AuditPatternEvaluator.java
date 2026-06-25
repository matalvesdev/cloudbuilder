package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Evaluator for AUDIT_PATTERN rules.
 * Checks if matching audit events exist based on the pattern configuration.
 */
@Component
public class AuditPatternEvaluator implements ComplianceRuleEvaluator {

    private final AuditEventRepository auditEventRepository;

    public AuditPatternEvaluator(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    @Override
    public ComplianceEvaluation evaluate(ComplianceRule rule) {
        if (rule.getConfigJson() == null || rule.getConfigJson().isBlank()) {
            return new ComplianceEvaluation(
                    rule.getId(), rule.getName(), rule.getCategory(),
                    rule.getSeverity(), false,
                    "Rule has no configuration pattern defined", Instant.now());
        }

        String pattern = rule.getConfigJson().replaceAll("[\"{}\\s]", "").toLowerCase();
        List<AuditEvent> events = auditEventRepository
                .findByTenantIdOrderByTimestampDesc(rule.getTenantId());

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
                rule.getSeverity(), found, message, Instant.now());
    }

    static String extractPatternValue(String configJson, String prefix) {
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
