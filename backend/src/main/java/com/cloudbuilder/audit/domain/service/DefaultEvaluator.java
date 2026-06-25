package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Default fallback evaluator for rule types that require external data
 * (COST_THRESHOLD, RESOURCE_CONSTRAINT, etc.).
 */
@Component
public class DefaultEvaluator implements ComplianceRuleEvaluator {

    @Override
    public ComplianceEvaluation evaluate(ComplianceRule rule) {
        return new ComplianceEvaluation(
                rule.getId(), rule.getName(), rule.getCategory(),
                rule.getSeverity(), true,
                "Rule type '" + rule.getRuleType()
                        + "' requires external data source for evaluation",
                Instant.now());
    }
}
