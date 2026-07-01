package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.observe.domain.service.HealthCheckService;
import com.cloudbuilder.shared.event.domain.DriftDetectedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Listens to drift detection events and reacts across modules.
 * - Creates alerts in Observe module when drift is detected (via HealthCheckService)
 * - Records healthy state when drift is resolved
 *
 * <p>Spring @EventListener fallback — active only when Kafka is DISABLED.
 * When Kafka is enabled, DriftEventListenerKafka handles consumption.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "false", matchIfMissing = true)
public class DriftEventListener {

    private static final Logger log = LoggerFactory.getLogger(DriftEventListener.class);

    private final HealthCheckService healthCheckService;

    public DriftEventListener(HealthCheckService healthCheckService) {
        this.healthCheckService = healthCheckService;
    }

    @EventListener
    public void onDriftDetected(DriftDetectedEvent event) {
        if (!event.hasDrift()) return;
        log.warn("Drift detected: {} resources drifted in environment {}",
            event.driftCount(), event.environmentId());
        // Cross-module reaction: create alert in Observe module
        // HealthCheckService.recordHealth() auto-creates alert for degraded/down status
        healthCheckService.recordHealth(
            "drift-detector",
            event.environmentId(),
            "degraded",
            0.0,
            0.0
        );
    }

    @EventListener
    public void onDriftResolved(DriftDetectedEvent event) {
        if (event.hasDrift()) return;
        log.info("Drift resolved in environment {}", event.environmentId());
        // Cross-module reaction: record healthy state (clears drift alert)
        healthCheckService.recordHealth(
            "drift-detector",
            event.environmentId(),
            "healthy",
            0.0,
            100.0
        );
    }
}
