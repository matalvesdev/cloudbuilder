package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.model.ComplianceRule;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import com.cloudbuilder.audit.domain.port.ComplianceRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplianceServiceTest {

    @Mock
    private ComplianceRuleRepository ruleRepository;

    @Mock
    private AuditEventRepository auditEventRepository;

    @Mock
    private OpaClientService opaClient;

    private ComplianceService complianceService;

    private ComplianceRuleEvaluator auditPatternEvaluator;

    @BeforeEach
    void setUp() {
        auditPatternEvaluator = new AuditPatternEvaluator(auditEventRepository);
        complianceService = new ComplianceService(ruleRepository, List.of(auditPatternEvaluator), opaClient);
    }

    @Test
    void evaluateAll_WithAuditPatternMatching_ShouldReturnPassed() {
        var tenantId = "tenant-1";
        var rule = new ComplianceRule(tenantId, "Login monitorado", "Detecta logins suspeitos",
                "SECURITY", "HIGH", "AUDIT_PATTERN",
                "{\"action\":\"login\"}", true);

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of(rule));
        when(auditEventRepository.findByTenantIdOrderByTimestampDesc(tenantId))
                .thenReturn(List.of(
                        new AuditEvent(tenantId, "user-1", "login", "Auth", "res-1", "", "10.0.0.1")));

        var evaluations = complianceService.evaluateAll(tenantId);

        assertFalse(evaluations.isEmpty());
        var eval = evaluations.get(0);
        assertTrue(eval.passed(), "Audit pattern matching should pass");
        assertEquals("Login monitorado", eval.ruleName());
    }

    @Test
    void evaluateAll_WithAuditPatternNotMatching_ShouldReturnFailed() {
        var tenantId = "tenant-1";
        var rule = new ComplianceRule(tenantId, "Deploy auditado", "Verifica deploys recentes",
                "OPERATIONS", "HIGH", "AUDIT_PATTERN",
                "{\"action\":\"deploy\"}", true);

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of(rule));
        when(auditEventRepository.findByTenantIdOrderByTimestampDesc(tenantId))
                .thenReturn(List.of(
                        new AuditEvent(tenantId, "user-1", "login", "Auth", "res-1", "", "10.0.0.1")));

        var evaluations = complianceService.evaluateAll(tenantId);

        assertFalse(evaluations.isEmpty());
        var eval = evaluations.get(0);
        assertFalse(eval.passed(), "Non-matching audit pattern should fail");
        assertTrue(eval.message().contains("No matching audit events"),
                "Message should indicate no matching events");
    }

    @Test
    void evaluateAll_WithEmptyConfigJson_ShouldReturnFailed() {
        var tenantId = "tenant-1";
        var rule = new ComplianceRule(tenantId, "Regra vazia", "Rule without config",
                "SECURITY", "MEDIUM", "AUDIT_PATTERN", null, true);

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of(rule));

        var evaluations = complianceService.evaluateAll(tenantId);

        assertFalse(evaluations.isEmpty());
        var eval = evaluations.get(0);
        assertFalse(eval.passed(), "Rule with null configJson should fail");
        assertTrue(eval.message().contains("no configuration pattern"),
                "Message should mention missing configuration");
    }

    @Test
    void evaluateAll_WithCostThresholdRule_ShouldReturnPassedWithMessage() {
        var tenantId = "tenant-1";
        var rule = new ComplianceRule(tenantId, "Custo máximo", "Limite de custo mensal",
                "COST", "MEDIUM", "COST_THRESHOLD",
                "{\"maxAmount\":5000}", true);

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of(rule));

        var evaluations = complianceService.evaluateAll(tenantId);

        assertFalse(evaluations.isEmpty());
        var eval = evaluations.get(0);
        assertTrue(eval.passed(), "COST_THRESHOLD should pass (requires external data)");
        assertTrue(eval.message().contains("requires external data source"),
                "Message should mention external data source");
    }

    @Test
    void evaluateAll_WithResourceConstraintRule_ShouldReturnPassedWithMessage() {
        var tenantId = "tenant-1";
        var rule = new ComplianceRule(tenantId, "Instância padrão", "Usar apenas t3.medium",
                "GOVERNANCE", "HIGH", "RESOURCE_CONSTRAINT",
                "{\"instanceType\":\"t3.medium\"}", true);

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of(rule));

        var evaluations = complianceService.evaluateAll(tenantId);

        assertFalse(evaluations.isEmpty());
        var eval = evaluations.get(0);
        assertTrue(eval.passed(), "RESOURCE_CONSTRAINT should pass (requires external data)");
    }

    @Test
    void evaluateAll_WithNoEnabledRules_ShouldReturnEmptyList() {
        var tenantId = "tenant-1";

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of());

        var evaluations = complianceService.evaluateAll(tenantId);

        assertTrue(evaluations.isEmpty());
    }

    @Test
    void evaluateAll_SortedBySeverityThenRuleName() {
        var tenantId = "tenant-1";
        var rule1 = new ComplianceRule(tenantId, "A-Login", "Login monitorado",
                "SECURITY", "HIGH", "AUDIT_PATTERN", "{\"action\":\"login\"}", true);
        var rule2 = new ComplianceRule(tenantId, "B-Custo", "Custo máximo",
                "COST", "LOW", "COST_THRESHOLD", "{\"maxAmount\":5000}", true);
        var rule3 = new ComplianceRule(tenantId, "C-Deploy", "Deploy auditado",
                "OPERATIONS", "CRITICAL", "AUDIT_PATTERN", "{\"action\":\"deploy\"}", true);

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of(rule1, rule2, rule3));
        // Mock audit events for pattern matching rules
        when(auditEventRepository.findByTenantIdOrderByTimestampDesc(tenantId))
                .thenReturn(List.of(
                        new AuditEvent(tenantId, "user-1", "login", "Auth", "res-1", "", "10.0.0.1"),
                        new AuditEvent(tenantId, "user-2", "deploy", "Pipeline", "res-2", "", "10.0.0.2")));

        var evaluations = complianceService.evaluateAll(tenantId);

        assertEquals(3, evaluations.size());
        // Sort order: severity CRITICAL first (C-Deploy), then HIGH (A-Login), then LOW (B-Custo)
        assertEquals("C-Deploy", evaluations.get(0).ruleName(),
                "First should be CRITICAL severity: C-Deploy");
        assertEquals("A-Login", evaluations.get(1).ruleName(),
                "Second should be HIGH severity: A-Login");
        assertEquals("B-Custo", evaluations.get(2).ruleName(),
                "Third should be LOW severity: B-Custo");
    }

    @Test
    void evaluateRule_WithValidRuleAndTenant_ShouldEvaluate() {
        var tenantId = "tenant-1";
        var rule = new ComplianceRule(tenantId, "Login monitorado", "Login detection",
                "SECURITY", "HIGH", "AUDIT_PATTERN", "{\"action\":\"login\"}", true);

        when(ruleRepository.findById(rule.getId())).thenReturn(Optional.of(rule));
        when(auditEventRepository.findByTenantIdOrderByTimestampDesc(tenantId))
                .thenReturn(List.of(
                        new AuditEvent(tenantId, "user-1", "login", "Auth", "res-1", "", "10.0.0.1")));

        var eval = complianceService.evaluateRule(tenantId, rule.getId());

        assertNotNull(eval);
        assertTrue(eval.passed());
        assertEquals("Login monitorado", eval.ruleName());
    }

    @Test
    void evaluateRule_WithWrongTenant_ShouldThrowIllegalArgument() {
        var tenantId = "tenant-1";
        var rule = new ComplianceRule("tenant-2", "Login monitorado", "Login detection",
                "SECURITY", "HIGH", "AUDIT_PATTERN", "{\"action\":\"login\"}", true);

        when(ruleRepository.findById(rule.getId())).thenReturn(Optional.of(rule));

        assertThrows(IllegalArgumentException.class,
                () -> complianceService.evaluateRule(tenantId, rule.getId()),
                "Should throw when tenant doesn't match");
    }

    @Test
    void evaluateRule_WithNonexistentRule_ShouldThrowIllegalArgument() {
        when(ruleRepository.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> complianceService.evaluateRule("tenant-1", "nonexistent"),
                "Should throw when rule not found");
    }

    @Test
    void getComplianceScore_WithAllPassed_ShouldReturn100() {
        var tenantId = "tenant-1";
        var rule1 = new ComplianceRule(tenantId, "Custo máximo", "Budget",
                "COST", "MEDIUM", "COST_THRESHOLD", "{}", true);
        var rule2 = new ComplianceRule(tenantId, "Instância padrão", "Instance type",
                "GOVERNANCE", "HIGH", "RESOURCE_CONSTRAINT", "{}", true);

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of(rule1, rule2));

        var score = complianceService.getComplianceScore(tenantId);

        assertEquals(100.0, score, 0.01, "All rules passing should give 100%");
    }

    @Test
    void getComplianceScore_WithMixedResults_ShouldCalculatePercentage() {
        var tenantId = "tenant-1";
        var rule1 = new ComplianceRule(tenantId, "Custo máximo", "Budget",
                "COST", "MEDIUM", "COST_THRESHOLD", "{}", true);
        var rule2 = new ComplianceRule(tenantId, "Deploy auditado", "Deploy check",
                "OPERATIONS", "HIGH", "AUDIT_PATTERN", "{\"action\":\"deploy\"}", true);

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of(rule1, rule2));
        // Only rule2 fails (no matching audit events)
        when(auditEventRepository.findByTenantIdOrderByTimestampDesc(tenantId))
                .thenReturn(List.of(
                        new AuditEvent(tenantId, "user-1", "login", "Auth", "res-1", "", "10.0.0.1")));

        var score = complianceService.getComplianceScore(tenantId);

        assertEquals(50.0, score, 0.01, "1/2 passing should give 50%");
    }

    @Test
    void getComplianceScore_WithNoRules_ShouldReturn100() {
        var tenantId = "tenant-1";

        when(ruleRepository.findByTenantIdAndEnabledTrue(tenantId)).thenReturn(List.of());

        var score = complianceService.getComplianceScore(tenantId);

        assertEquals(100.0, score, 0.01, "No rules should default to 100%");
    }

    @Test
    void createRule_ShouldSaveAndReturn() {
        var tenantId = "tenant-1";

        when(ruleRepository.save(any(ComplianceRule.class))).thenAnswer(i -> i.getArgument(0));

        var rule = complianceService.createRule(tenantId, "Nova regra", "Description",
                "SECURITY", "HIGH", "AUDIT_PATTERN", "{\"action\":\"test\"}", true);

        assertNotNull(rule);
        assertEquals("Nova regra", rule.getName());
        assertEquals(tenantId, rule.getTenantId());
        assertEquals("AUDIT_PATTERN", rule.getRuleType());
        assertTrue(rule.isEnabled());
        verify(ruleRepository).save(any(ComplianceRule.class));
    }

    @Test
    void updateRule_ShouldUpdateFields() {
        var existingRule = new ComplianceRule("tenant-1", "Old name", "Old desc",
                "SECURITY", "LOW", "COST_THRESHOLD", "{}", false);
        var ruleId = existingRule.getId();

        when(ruleRepository.findById(ruleId)).thenReturn(Optional.of(existingRule));
        when(ruleRepository.save(any(ComplianceRule.class))).thenAnswer(i -> i.getArgument(0));

        var result = complianceService.updateRule(ruleId, "New name", "New desc",
                "GOVERNANCE", "HIGH", "AUDIT_PATTERN", "{\"action\":\"deploy\"}", true);

        assertTrue(result.isPresent());
        assertEquals("New name", result.get().getName());
        assertEquals("GOVERNANCE", result.get().getCategory());
        assertEquals("HIGH", result.get().getSeverity());
        assertTrue(result.get().isEnabled());
        verify(ruleRepository).save(existingRule);
    }

    @Test
    void updateRule_WithNonexistentRule_ShouldReturnEmpty() {
        when(ruleRepository.findById("nonexistent")).thenReturn(Optional.empty());

        var result = complianceService.updateRule("nonexistent", "New name", "New desc",
                "SECURITY", "HIGH", "AUDIT_PATTERN", "{}", true);

        assertTrue(result.isEmpty());
        verify(ruleRepository, never()).save(any());
    }

    @Test
    void deleteRule_ShouldDelete() {
        complianceService.deleteRule("rule-1");

        verify(ruleRepository).deleteById("rule-1");
    }

    @Test
    void getRulesByTenant_ShouldReturnRules() {
        var tenantId = "tenant-1";
        when(ruleRepository.findByTenantId(tenantId)).thenReturn(List.of(
                new ComplianceRule(tenantId, "Rule 1", "Desc", "SECURITY", "HIGH", "AUDIT_PATTERN", "{}", true)));

        var rules = complianceService.getRulesByTenant(tenantId);

        assertEquals(1, rules.size());
        assertEquals("Rule 1", rules.get(0).getName());
    }
}
