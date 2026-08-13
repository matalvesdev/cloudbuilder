package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpaPolicyEvaluatorTest {

    @Mock
    private OpaClientService opaClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private OpaPolicyEvaluator evaluator;

    @BeforeEach
    void setUp() {
        evaluator = new OpaPolicyEvaluator(opaClient, objectMapper);
    }

    @Test
    void evaluate_WithNonOpaRuleType_ShouldReturnNotSupported() {
        var rule = new ComplianceRule("tenant-1", "Test", "Desc",
                "SECURITY", "HIGH", "AUDIT_PATTERN", "{}", true);

        var result = evaluator.evaluate(rule);

        assertFalse(result.passed());
        assertTrue(result.message().contains("not supported"));
    }

    @Test
    void evaluate_WithOpaRuleTypeAndPass_ShouldReturnPassed() {
        var rule = new ComplianceRule("tenant-1", "Cost policy", "Cost check",
                "COST", "MEDIUM", "OPA_POLICY",
                "{\"threshold\":1000}", true);

        when(opaClient.evaluate(eq("compliance/cloudbuilder/cost"), any()))
                .thenReturn(Optional.of(Map.of("allow", true)));

        var result = evaluator.evaluate(rule);

        assertTrue(result.passed());
        assertEquals("Cost policy", result.ruleName());
        verify(opaClient).evaluate(eq("compliance/cloudbuilder/cost"), any());
    }

    @Test
    void evaluate_WithOpaRuleTypeAndFail_ShouldReturnFailed() {
        var rule = new ComplianceRule("tenant-1", "Security policy", "Security check",
                "SECURITY", "CRITICAL", "OPA_POLICY",
                "{\"encryption\":\"required\"}", true);

        when(opaClient.evaluate(eq("compliance/cloudbuilder/security"), any()))
                .thenReturn(Optional.of(Map.of("allow", false)));

        var result = evaluator.evaluate(rule);

        assertFalse(result.passed());
        assertTrue(result.message().contains("não conformidade"));
        verify(opaClient).evaluate(eq("compliance/cloudbuilder/security"), any());
    }

    @Test
    void evaluate_WithOpaUnavailable_ShouldFallback() {
        var rule = new ComplianceRule("tenant-1", "Cost limit", "Budget check",
                "COST", "MEDIUM", "OPA_POLICY",
                "{\"threshold\":1000, \"value\":500}", true);

        when(opaClient.evaluate(eq("compliance/cloudbuilder/cost"), any()))
                .thenReturn(Optional.empty());

        var result = evaluator.evaluate(rule);

        assertTrue(result.passed());
        assertTrue(result.message().contains("threshold"));
        verify(opaClient).evaluate(eq("compliance/cloudbuilder/cost"), any());
    }

    @Test
    void evaluate_WithOpaUnavailableAndExceededThreshold_ShouldFail() {
        var rule = new ComplianceRule("tenant-1", "Cost limit", "Budget check",
                "COST", "MEDIUM", "OPA_POLICY",
                "{\"threshold\":1000, \"value\":2000}", true);

        when(opaClient.evaluate(eq("compliance/cloudbuilder/cost"), any()))
                .thenReturn(Optional.empty());

        var result = evaluator.evaluate(rule);

        assertFalse(result.passed());
        assertTrue(result.message().contains("threshold excedido"));
    }

    @Test
    void evaluate_WithOpaUnavailableAndNoConfig_ShouldDefaultPass() {
        var rule = new ComplianceRule("tenant-1", "Blank config", "No config",
                "SECURITY", "HIGH", "OPA_POLICY", null, true);

        when(opaClient.evaluate(any(), any()))
                .thenReturn(Optional.empty());

        var result = evaluator.evaluate(rule);

        // When OPA is unavailable and config is null, fallback fails closed
        // (no deterministic rule to evaluate)
        assertFalse(result.passed());
        assertTrue(result.message().contains("OPA indisponível") || result.message().contains("fallback"));
    }

    @Test
    void evaluate_WithGovernanceCategory_ShouldMapToGovernancePath() {
        var rule = new ComplianceRule("tenant-1", "Governance", "Gov check",
                "GOVERNANCE", "HIGH", "OPA_POLICY", "{}", true);

        when(opaClient.evaluate(eq("compliance/cloudbuilder/governance"), any()))
                .thenReturn(Optional.of(Map.of("allow", true)));

        var result = evaluator.evaluate(rule);

        assertTrue(result.passed());
        verify(opaClient).evaluate(eq("compliance/cloudbuilder/governance"), any());
    }

    @Test
    void evaluate_WithOperationsCategory_ShouldMapToGovernancePath() {
        var rule = new ComplianceRule("tenant-1", "Ops", "Ops check",
                "OPERATIONS", "LOW", "OPA_POLICY", "{}", true);

        when(opaClient.evaluate(eq("compliance/cloudbuilder/governance"), any()))
                .thenReturn(Optional.of(Map.of("allow", true)));

        evaluator.evaluate(rule);

        verify(opaClient).evaluate(eq("compliance/cloudbuilder/governance"), any());
    }

    @Test
    void evaluate_WithUnknownCategory_ShouldMapToCustomPath() {
        var rule = new ComplianceRule("tenant-1", "Custom", "Custom check",
                "UNKNOWN", "MEDIUM", "OPA_POLICY", "{}", true);

        when(opaClient.evaluate(eq("compliance/cloudbuilder/custom"), any()))
                .thenReturn(Optional.of(Map.of("allow", true)));

        evaluator.evaluate(rule);

        verify(opaClient).evaluate(eq("compliance/cloudbuilder/custom"), any());
    }

    @Test
    void mapCategoryToPolicyPath_ShouldReturnCorrectPaths() {
        assertEquals("compliance/cloudbuilder/security",
                OpaPolicyEvaluator.mapCategoryToPolicyPath("SECURITY"));
        assertEquals("compliance/cloudbuilder/cost",
                OpaPolicyEvaluator.mapCategoryToPolicyPath("COST"));
        assertEquals("compliance/cloudbuilder/governance",
                OpaPolicyEvaluator.mapCategoryToPolicyPath("GOVERNANCE"));
        assertEquals("compliance/cloudbuilder/governance",
                OpaPolicyEvaluator.mapCategoryToPolicyPath("OPERATIONS"));
        assertEquals("compliance/cloudbuilder/custom",
                OpaPolicyEvaluator.mapCategoryToPolicyPath("CUSTOM"));
    }

    @Test
    void evaluate_ShouldBuildOpaInputFromRule() {
        var rule = new ComplianceRule("tenant-1", "Test policy", "Testing",
                "SECURITY", "HIGH", "OPA_POLICY",
                "{\"encryption\":\"required\"}", true);

        when(opaClient.evaluate(eq("compliance/cloudbuilder/security"), argThat(input ->
                "security".equals(input.get("resourceType"))
                        && "high".equals(input.get("severity"))
                        && "tenant-1".equals(input.get("tenantId"))
                        && "required".equals(input.get("encryption"))
        ))).thenReturn(Optional.of(Map.of("allow", true)));

        var result = evaluator.evaluate(rule);

        assertTrue(result.passed());
    }
}
