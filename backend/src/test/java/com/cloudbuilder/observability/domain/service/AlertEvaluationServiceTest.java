package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.domain.model.AlertRuleEntity;
import com.cloudbuilder.observability.domain.model.IncidentEntity;
import com.cloudbuilder.observability.domain.port.AlertRuleEvaluationRepository;
import com.cloudbuilder.observability.domain.port.AlertRuleRepository;
import com.cloudbuilder.observability.domain.port.ObserveIncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertEvaluationServiceTest {

    @Mock
    private AlertRuleRepository alertRuleRepository;

    @Mock
    private AlertRuleEvaluationRepository evaluationRepository;

    @Mock
    private ObserveIncidentRepository incidentRepository;

    @Mock
    private MetricsService metricsService;

    @Mock
    private NotificationService notificationService;

    private AlertEvaluationService alertEvaluationService;

    @BeforeEach
    void setUp() {
        alertEvaluationService = new AlertEvaluationService(
                alertRuleRepository, evaluationRepository, incidentRepository,
                metricsService, notificationService);
    }

    private AlertRuleEntity createRule(String id, String metricName, String condition, double threshold,
                                        int durationSec, String severity, boolean enabled) {
        var rule = new AlertRuleEntity();
        rule.setId(id);
        rule.setTenantId("t1");
        rule.setName("CPU High");
        rule.setMetricName(metricName);
        rule.setCondition(condition);
        rule.setThreshold(threshold);
        rule.setDurationSec(durationSec);
        rule.setSeverity(severity);
        rule.setEnabled(enabled);
        return rule;
    }

    @Test
    void evaluateAllRules_WithNoRules_ShouldDoNothing() {
        when(alertRuleRepository.findAll()).thenReturn(List.of());
        alertEvaluationService.evaluateAllRules();
        verifyNoInteractions(metricsService);
    }

    @Test
    void evaluateAllRules_WithDisabledRule_ShouldSkip() {
        var rule = createRule(UUID.randomUUID().toString(), "cpu.usage", "gt", 90.0, 60, "CRITICAL", false);
        when(alertRuleRepository.findAll()).thenReturn(List.of(rule));

        alertEvaluationService.evaluateAllRules();

        verifyNoInteractions(metricsService);
    }

    @Test
    void evaluateAllRules_BreachedCondition_ShouldCreateIncident() {
        var ruleId = UUID.randomUUID().toString();
        var rule = createRule(ruleId, "cpu.usage", "gt", 90.0, 60, "CRITICAL", true);
        rule.setNotifyChannels("[\"" + UUID.randomUUID().toString() + "\"]");
        when(alertRuleRepository.findAll()).thenReturn(List.of(rule));
        when(metricsService.getAggregation(anyString(), anyString(), any(), any(), anyString())).thenReturn(95.0);
        when(incidentRepository.findByAlertRuleIdAndStatus(ruleId, "OPEN")).thenReturn(Optional.empty());
        when(incidentRepository.findByAlertRuleIdAndStatus(ruleId, "ACKNOWLEDGED")).thenReturn(Optional.empty());
        when(incidentRepository.save(any(IncidentEntity.class))).thenAnswer(i -> i.getArgument(0));

        alertEvaluationService.evaluateAllRules();

        verify(incidentRepository).save(any(IncidentEntity.class));
        verify(notificationService).sendNotification(any(IncidentEntity.class), eq(rule));
    }

    @Test
    void evaluateAllRules_NoBreach_ShouldNotCreateIncident() {
        var ruleId = UUID.randomUUID().toString();
        var rule = createRule(ruleId, "cpu.usage", "gt", 90.0, 60, "CRITICAL", true);
        when(alertRuleRepository.findAll()).thenReturn(List.of(rule));
        when(metricsService.getAggregation(anyString(), anyString(), any(), any(), anyString())).thenReturn(50.0);

        alertEvaluationService.evaluateAllRules();

        verify(incidentRepository, never()).save(any(IncidentEntity.class));
    }

    @Test
    void evaluateAllRules_WithExistingOpenIncident_ShouldDeduplicate() {
        var ruleId = UUID.randomUUID().toString();
        var rule = createRule(ruleId, "cpu.usage", "gt", 90.0, 60, "CRITICAL", true);
        when(alertRuleRepository.findAll()).thenReturn(List.of(rule));
        when(metricsService.getAggregation(anyString(), anyString(), any(), any(), anyString())).thenReturn(95.0);
        when(incidentRepository.findByAlertRuleIdAndStatus(ruleId, "OPEN"))
                .thenReturn(Optional.of(new IncidentEntity(ruleId, "t1", "Open", "", "CRITICAL", 95.0, 90.0)));

        alertEvaluationService.evaluateAllRules();

        verify(incidentRepository, never()).save(any(IncidentEntity.class));
        verify(notificationService, never()).sendNotification(any(), any());
    }

    @Test
    void evaluateAllRules_WithExistingAcknowledgedIncident_ShouldDeduplicate() {
        var ruleId = UUID.randomUUID().toString();
        var rule = createRule(ruleId, "cpu.usage", "gt", 90.0, 60, "CRITICAL", true);
        when(alertRuleRepository.findAll()).thenReturn(List.of(rule));
        when(metricsService.getAggregation(anyString(), anyString(), any(), any(), anyString())).thenReturn(95.0);
        when(incidentRepository.findByAlertRuleIdAndStatus(ruleId, "OPEN")).thenReturn(Optional.empty());
        when(incidentRepository.findByAlertRuleIdAndStatus(ruleId, "ACKNOWLEDGED"))
                .thenReturn(Optional.of(new IncidentEntity(ruleId, "t1", "Ack", "", "CRITICAL", 95.0, 90.0)));

        alertEvaluationService.evaluateAllRules();

        verify(incidentRepository, never()).save(any(IncidentEntity.class));
    }

    @Test
    void evaluateAllRules_LtCondition_ShouldEvaluateCorrectly() {
        var ruleId = UUID.randomUUID().toString();
        var rule = createRule(ruleId, "memory.free", "lt", 256.0, 60, "WARNING", true);
        when(alertRuleRepository.findAll()).thenReturn(List.of(rule));
        when(metricsService.getAggregation(anyString(), anyString(), any(), any(), anyString())).thenReturn(100.0);
        when(incidentRepository.findByAlertRuleIdAndStatus(ruleId, "OPEN")).thenReturn(Optional.empty());
        when(incidentRepository.findByAlertRuleIdAndStatus(ruleId, "ACKNOWLEDGED")).thenReturn(Optional.empty());
        when(incidentRepository.save(any(IncidentEntity.class))).thenAnswer(i -> i.getArgument(0));

        alertEvaluationService.evaluateAllRules();

        verify(incidentRepository).save(any(IncidentEntity.class));
    }

    @Test
    void evaluateAllRules_WhenGetAggregationFails_ShouldSkipRule() {
        var rule = createRule(UUID.randomUUID().toString(), "cpu.usage", "gt", 90.0, 60, "CRITICAL", true);
        when(alertRuleRepository.findAll()).thenReturn(List.of(rule));
        when(metricsService.getAggregation(anyString(), anyString(), any(), any(), anyString()))
                .thenThrow(new RuntimeException("Metric fetch failed"));

        alertEvaluationService.evaluateAllRules();

        verify(incidentRepository, never()).save(any(IncidentEntity.class));
        // Should not throw -- exception is caught per rule
    }
}
