package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import com.cloudbuilder.audit.domain.port.ComplianceRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComplianceService {

    private final ComplianceRuleRepository ruleRepository;
    private final Map<String, ComplianceRuleEvaluator> evaluators;
    private final OpaClientService opaClient;

    public ComplianceService(ComplianceRuleRepository ruleRepository,
                              List<ComplianceRuleEvaluator> evaluatorList,
                              OpaClientService opaClient) {
        this.ruleRepository = ruleRepository;
        this.opaClient = opaClient;
        this.evaluators = new HashMap<>();
        for (ComplianceRuleEvaluator evaluator : evaluatorList) {
            String ruleType = resolveRuleType(evaluator);
            if (ruleType != null) {
                this.evaluators.put(ruleType, evaluator);
            }
        }
    }

    /**
     * Resolve the rule type string for a given evaluator.
     * New evaluators can be registered by adding entries here.
     */
    static String resolveRuleType(ComplianceRuleEvaluator evaluator) {
        if (evaluator instanceof AuditPatternEvaluator) return "AUDIT_PATTERN";
        if (evaluator instanceof OpaPolicyEvaluator) return OpaPolicyEvaluator.OPA_RULE_TYPE;
        return null;
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

    /**
     * Check if the OPA sidecar is reachable.
     */
    public boolean isOpaReachable() {
        return opaClient.isReachable();
    }

    private ComplianceEvaluation evaluateRuleAgainstAudit(ComplianceRule rule) {
        ComplianceRuleEvaluator evaluator = evaluators.get(rule.getRuleType());
        if (evaluator != null) {
            return evaluator.evaluate(rule);
        }
        // Default evaluator for unregistered rule types
        return new DefaultEvaluator().evaluate(rule);
    }
}
