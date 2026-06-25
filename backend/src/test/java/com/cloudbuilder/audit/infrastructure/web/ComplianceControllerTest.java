package com.cloudbuilder.audit.infrastructure.web;

import com.cloudbuilder.audit.application.dto.ComplianceEvaluation;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import com.cloudbuilder.audit.domain.service.ComplianceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplianceControllerTest {

    @Mock
    private ComplianceService complianceService;

    private ComplianceController controller;

    @BeforeEach
    void setUp() {
        controller = new ComplianceController(complianceService);
    }

    @Test
    void evaluateAll_ShouldReturnEvaluations() {
        var evaluations = List.of(
                new ComplianceEvaluation("rule-1", "Rule 1", "SECURITY", "HIGH", true, "OK", Instant.now())
        );
        when(complianceService.evaluateAll("tenant-1")).thenReturn(evaluations);

        var response = controller.evaluateAll("tenant-1");
        var body = response.getBody();

        assertNotNull(body);
        assertEquals(1, body.size());
        assertEquals("Rule 1", body.get(0).ruleName());
        assertTrue(body.get(0).passed());
    }

    @Test
    void evaluateRule_ShouldReturnEvaluation() {
        var evaluation = new ComplianceEvaluation("rule-1", "Rule 1", "SECURITY", "HIGH", true, "OK", Instant.now());
        when(complianceService.evaluateRule("tenant-1", "rule-1")).thenReturn(evaluation);

        var response = controller.evaluateRule("tenant-1", "rule-1");
        var body = response.getBody();

        assertNotNull(body);
        assertTrue(body.passed());
        assertEquals("rule-1", body.ruleId());
    }

    @Test
    void getScore_ShouldReturnScoreMap() {
        when(complianceService.getComplianceScore("tenant-1")).thenReturn(85.0);

        var response = controller.getScore("tenant-1");
        var body = response.getBody();

        assertNotNull(body);
        assertEquals("tenant-1", body.get("tenantId"));
        assertEquals(85.0, (Double) body.get("score"), 0.01);
        assertEquals("good", body.get("status"));
    }

    @Test
    void getScore_WithLowScore_ShouldReturnWarning() {
        when(complianceService.getComplianceScore("tenant-1")).thenReturn(65.0);

        var body = controller.getScore("tenant-1").getBody();

        assertNotNull(body);
        assertEquals("warning", body.get("status"));
    }

    @Test
    void getScore_WithCriticalScore_ShouldReturnCritical() {
        when(complianceService.getComplianceScore("tenant-1")).thenReturn(30.0);

        var body = controller.getScore("tenant-1").getBody();

        assertNotNull(body);
        assertEquals("critical", body.get("status"));
    }

    @Test
    void getRules_ShouldReturnRules() {
        var rules = List.of(
                new ComplianceRule("tenant-1", "Rule 1", "Desc", "SECURITY", "HIGH", "AUDIT_PATTERN", "{}", true)
        );
        when(complianceService.getRulesByTenant("tenant-1")).thenReturn(rules);

        var response = controller.getRules("tenant-1");
        var body = response.getBody();

        assertNotNull(body);
        assertEquals(1, body.size());
        assertEquals("Rule 1", body.get(0).getName());
    }

    @Test
    void createRule_ShouldCreateAndReturn() {
        var rule = new ComplianceRule("tenant-1", "New Rule", "Desc",
                "SECURITY", "HIGH", "OPA_POLICY", "{\"threshold\":100}", true);
        when(complianceService.createRule(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenReturn(rule);

        var request = new ComplianceController.CreateRuleRequest(
                "New Rule", "Desc", "SECURITY", "HIGH", "OPA_POLICY",
                "{\"threshold\":100}", true);

        var response = controller.createRule("tenant-1", request);
        var body = response.getBody();

        assertNotNull(body);
        assertEquals(201, response.getStatusCode().value());
        assertEquals("New Rule", body.getName());
        assertEquals("OPA_POLICY", body.getRuleType());
    }

    @Test
    void updateRule_ShouldUpdateAndReturn() {
        var rule = new ComplianceRule("tenant-1", "Updated", "Updated desc",
                "COST", "LOW", "AUDIT_PATTERN", "{}", false);
        when(complianceService.updateRule(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenReturn(Optional.of(rule));

        var request = new ComplianceController.CreateRuleRequest(
                "Updated", "Updated desc", "COST", "LOW", "AUDIT_PATTERN",
                "{}", false);

        var response = controller.updateRule("rule-1", request);
        var body = response.getBody();

        assertNotNull(body);
        assertEquals("Updated", body.getName());
        assertEquals("COST", body.getCategory());
    }

    @Test
    void updateRule_WithNonexistentRule_ShouldReturnNotFound() {
        when(complianceService.updateRule(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenReturn(Optional.empty());

        var request = new ComplianceController.CreateRuleRequest(
                "Updated", "Desc", "SECURITY", "HIGH", "AUDIT_PATTERN", "{}", true);

        var response = controller.updateRule("nonexistent", request);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void deleteRule_ShouldReturnNoContent() {
        doNothing().when(complianceService).deleteRule("rule-1");

        var response = controller.deleteRule("rule-1");

        assertEquals(204, response.getStatusCode().value());
        verify(complianceService).deleteRule("rule-1");
    }

    @Test
    void opaStatus_WithReachableOpa_ShouldReturnReachable() {
        when(complianceService.isOpaReachable()).thenReturn(true);

        var response = controller.opaStatus();
        var body = response.getBody();

        assertNotNull(body);
        assertTrue((Boolean) body.get("reachable"));
        assertTrue((Boolean) body.get("opaEnabled"));
    }

    @Test
    void opaStatus_WithUnreachableOpa_ShouldReturnNotReachable() {
        when(complianceService.isOpaReachable()).thenReturn(false);

        var response = controller.opaStatus();
        var body = response.getBody();

        assertNotNull(body);
        assertFalse((Boolean) body.get("reachable"));
        assertTrue((Boolean) body.get("opaEnabled"));
    }

    @Test
    void evaluateAll_WithEmptyList_ShouldReturnEmpty() {
        when(complianceService.evaluateAll("tenant-1")).thenReturn(List.of());

        var response = controller.evaluateAll("tenant-1");
        var body = response.getBody();

        assertNotNull(body);
        assertTrue(body.isEmpty());
    }
}
