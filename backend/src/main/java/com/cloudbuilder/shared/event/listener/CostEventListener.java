package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.observe.domain.service.HealthCheckService;
import com.cloudbuilder.shared.event.domain.CostAnomalyEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Listens to cost-related events and reacts across modules.
 * - Creates alerts when cost anomalies are detected (via HealthCheckService)
 * - Logs budget thresholds being exceeded
 *
 * <p>Spring @EventListener fallback — active only when Kafka is DISABLED.
 * When Kafka is enabled, CostEventListenerKafka handles consumption.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "false", matchIfMissing = true)
public class CostEventListener {

    private static final Logger log = LoggerFactory.getLogger(CostEventListener.class);

    private final HealthCheckService healthCheckService;

    public CostEventListener(HealthCheckService healthCheckService) {
        this.healthCheckService = healthCheckService;
    }

    @EventListener
    public void onCostAnomaly(CostAnomalyEvent event) {
        log.warn("Cost anomaly: ${} exceed threshold ${} in environment {}",
            String.format("%.2f", event.currentSpend()),
            String.format("%.2f", event.threshold()),
            event.environmentId());
        // Cross-module reaction: create cost alert in Observe module
        // HealthCheckService.recordHealth() auto-creates alert for degraded/down status
        healthCheckService.recordHealth(
            "cost-monitor",
            event.environmentId(),
            "degraded",
            0.0,
            0.0
        );
    }
}
