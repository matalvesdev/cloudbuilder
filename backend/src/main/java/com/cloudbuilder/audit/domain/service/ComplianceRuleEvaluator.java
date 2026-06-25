package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.ComplianceRule;

/**
 * Strategy interface for evaluating compliance rules.
 * Each rule type (AUDIT_PATTERN, COST_THRESHOLD, RESOURCE_CONSTRAINT)
 * gets its own evaluator implementation.
 */
@FunctionalInterface
public interface ComplianceRuleEvaluator {

    /**
     * Evaluate a compliance rule and produce a ComplianceEvaluation.
     *
     * @param rule the compliance rule to evaluate
     * @return evaluation result
     */
    ComplianceEvaluation evaluate(ComplianceRule rule);
}
