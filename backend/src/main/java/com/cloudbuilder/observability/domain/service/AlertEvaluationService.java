package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.domain.model.AlertRuleEntity;
import com.cloudbuilder.observability.domain.model.AlertRuleEvaluationEntity;
import com.cloudbuilder.observability.domain.model.IncidentEntity;
import com.cloudbuilder.observability.domain.port.AlertRuleEvaluationRepository;
import com.cloudbuilder.observability.domain.port.AlertRuleRepository;
import com.cloudbuilder.observability.domain.port.ObserveIncidentRepository;
import com.cloudbuilder.observability.domain.port.NotificationChannelRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
/**
 * Periodically evaluates all enabled alert rules against current metrics.
 * Runs every 30 seconds.
 */
@Service
public class AlertEvaluationService {

    private final AlertRuleRepository alertRuleRepository;
    private final AlertRuleEvaluationRepository evaluationRepository;
    private final ObserveIncidentRepository observeIncidentRepository;
    private final MetricsService metricsService;
    private final NotificationService notificationService;

    public AlertEvaluationService(AlertRuleRepository alertRuleRepository,
                                  AlertRuleEvaluationRepository evaluationRepository,
                                   ObserveIncidentRepository observeIncidentRepository,
                                  MetricsService metricsService,
                                  NotificationService notificationService) {
        this.alertRuleRepository = alertRuleRepository;
        this.evaluationRepository = evaluationRepository;
        this.observeIncidentRepository = observeIncidentRepository;
        this.metricsService = metricsService;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void evaluateAllRules() {
        List<AlertRuleEntity> rules = alertRuleRepository.findAll();
        for (AlertRuleEntity rule : rules) {
            if (rule.isEnabled()) {
                evaluateRule(rule);
            }
        }
    }

    private void evaluateRule(AlertRuleEntity rule) {
        try {
            Instant end = Instant.now();
            Instant start = end.minus(Duration.ofSeconds(Math.max(rule.getDurationSec(), 60)));

            double currentValue = metricsService.getAggregation(
                rule.getMetricName(), rule.getTenantId(), start, end, "AVG");

            boolean breached = isBreached(currentValue, rule.getCondition(), rule.getThreshold());

            AlertRuleEvaluationEntity evaluation = new AlertRuleEvaluationEntity(
                rule.getId(), rule.getTenantId(), Instant.now(), currentValue, rule.getThreshold(), breached);
            evaluationRepository.save(evaluation);

            if (breached) {
                handleBreach(rule, currentValue);
            }
        } catch (Exception e) {
            // Log evaluation failure but don't block other rules
            System.err.printf("Alert evaluation failed for rule %s: %s%n", rule.getName(), e.getMessage());
        }
    }

    private boolean isBreached(double value, String condition, double threshold) {
        return switch (condition.toLowerCase()) {
            case "gt" -> value > threshold;
            case "lt" -> value < threshold;
            case "gte" -> value >= threshold;
            case "lte" -> value <= threshold;
            case "eq" -> Math.abs(value - threshold) < 0.0001;
            default -> false;
        };
    }

    private void handleBreach(AlertRuleEntity rule, double currentValue) {
        Optional<IncidentEntity> existingOpen = observeIncidentRepository
            .findByAlertRuleIdAndStatus(rule.getId(), "OPEN");

        if (existingOpen.isPresent()) {
            return; // Already an open incident for this rule — deduplicated
        }

        Optional<IncidentEntity> existingAck = observeIncidentRepository
            .findByAlertRuleIdAndStatus(rule.getId(), "ACKNOWLEDGED");

        if (existingAck.isPresent()) {
            return; // Already acknowledged
        }

        IncidentEntity incident = new IncidentEntity(
            rule.getId(),
            rule.getTenantId(),
            rule.getName() + " — threshold breached",
            String.format("Metric %s value %.2f %s threshold %.2f for %d seconds",
                rule.getMetricName(), currentValue, rule.getCondition(), rule.getThreshold(), rule.getDurationSec()),
            rule.getSeverity(),
            currentValue,
            rule.getThreshold()
        );
        observeIncidentRepository.save(incident);

        notificationService.sendNotification(incident, rule);
    }
}
