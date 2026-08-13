package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Evaluator for OPA-managed policy rules (ruleType = "OPA_POLICY").
 * <p>
 * Delegates evaluation to the OPA (Open Policy Agent) engine via REST API.
 * Falls back to Java-based evaluation if OPA is unavailable, per ADR-020.
 * <p>
 * The OPA policy path is derived from the rule's configJson:
 * {@code {"policy": "compliance/cloudbuilder/cost", "rule": "allow"}}
 * <p>
 * Maps rule categories to OPA packages:
 * - SECURITY → compliance.cloudbuilder.security
 * - COST → compliance.cloudbuilder.cost
 * - OPERATIONS → compliance.cloudbuilder.governance
 * - GOVERNANCE → compliance.cloudbuilder.governance
 */
@Component
public class OpaPolicyEvaluator implements ComplianceRuleEvaluator {

    private static final Logger log = LoggerFactory.getLogger(OpaPolicyEvaluator.class);

    private final OpaClientService opaClient;
    private final ObjectMapper objectMapper;

    public OpaPolicyEvaluator(OpaClientService opaClient, ObjectMapper objectMapper) {
        this.opaClient = opaClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public ComplianceEvaluation evaluate(ComplianceRule rule) {
        if (!OPA_RULE_TYPE.equals(rule.getRuleType())) {
            return new ComplianceEvaluation(
                rule.getId(), rule.getName(), rule.getCategory(),
                rule.getSeverity(), false,
                "Rule type not supported by OPA evaluator: " + rule.getRuleType(),
                Instant.now());
        }

        // Build OPA input from rule config and metadata
        Map<String, Object> input = buildOpaInput(rule);

        // Derive OPA policy path from rule category
        String policyPath = mapCategoryToPolicyPath(rule.getCategory());

        // Evaluate via OPA
        Optional<Map<String, Object>> opaResult = opaClient.evaluate(policyPath, input);

        if (opaResult.isPresent()) {
            Map<String, Object> result = opaResult.get();
            boolean passed = result.get("allow") instanceof Boolean b && b;

            log.info("OPA evaluation for rule '{}': passed={}, policy={}",
                rule.getName(), passed, policyPath);

            return new ComplianceEvaluation(
                rule.getId(), rule.getName(), rule.getCategory(),
                rule.getSeverity(), passed,
                passed ? "Política OPA: conformidade ok" : "Política OPA: não conformidade detectada",
                Instant.now());
        }

        // OPA unavailable — fallback to Java-based evaluation
        log.warn("OPA unavailable for rule '{}', falling back to Java evaluator", rule.getName());
        return evaluateFallback(rule);
    }

    /**
     * Fallback evaluation when OPA is not reachable.
     * Uses basic heuristics based on rule configuration.
     */
    private ComplianceEvaluation evaluateFallback(ComplianceRule rule) {
        try {
            Map<String, Object> config = objectMapper.readValue(
                rule.getConfigJson(),
                new TypeReference<Map<String, Object>>() {});

            // Simple threshold-based fallback evaluation
            Object thresholdObj = config.get("threshold");
            Object valueObj = config.get("value");

            if (thresholdObj instanceof Number threshold && valueObj instanceof Number value) {
                boolean passed = value.doubleValue() <= threshold.doubleValue();
                return new ComplianceEvaluation(
                    rule.getId(), rule.getName(), rule.getCategory(),
                    rule.getSeverity(), passed,
                    passed ? "Fallback Java: dentro do threshold"
                           : "Fallback Java: threshold excedido (" + value + " > " + threshold + ")",
                    Instant.now());
            }
        } catch (Exception e) {
            log.debug("Could not parse config for fallback evaluation: {}", e.getMessage());
        }

        // Fail closed when neither OPA nor a deterministic local rule can decide.
        return new ComplianceEvaluation(
            rule.getId(), rule.getName(), rule.getCategory(),
            rule.getSeverity(), false,
            "Fallback Java: OPA indisponível e regra sem fallback determinístico",
            Instant.now());
    }

    /**
     * Build OPA input map from a ComplianceRule's config and metadata.
     */
    private Map<String, Object> buildOpaInput(ComplianceRule rule) {
        Map<String, Object> input = new HashMap<>();
        input.put("resourceType", rule.getCategory().toLowerCase());
        input.put("severity", rule.getSeverity().toLowerCase());
        input.put("ruleName", rule.getName());
        input.put("tenantId", rule.getTenantId());

        // Parse configJson as additional input fields
        if (rule.getConfigJson() != null && !rule.getConfigJson().isBlank()) {
            try {
                Map<String, Object> config = objectMapper.readValue(
                    rule.getConfigJson(),
                    new TypeReference<Map<String, Object>>() {});
                input.putAll(config);
            } catch (Exception e) {
                log.debug("Could not parse configJson for rule '{}': {}", rule.getName(), e.getMessage());
            }
        }

        return input;
    }

    /**
     * Map a ComplianceRule category to an OPA policy path.
     */
    static String mapCategoryToPolicyPath(String category) {
        return switch (category.toUpperCase()) {
            case "SECURITY" -> "compliance/cloudbuilder/security";
            case "COST" -> "compliance/cloudbuilder/cost";
            case "OPERATIONS", "GOVERNANCE" -> "compliance/cloudbuilder/governance";
            default -> "compliance/cloudbuilder/custom";
        };
    }

    static final String OPA_RULE_TYPE = "OPA_POLICY";
}
