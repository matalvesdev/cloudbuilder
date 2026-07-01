package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.observe.domain.service.HealthCheckService;
import com.cloudbuilder.shared.event.config.InboxProcessor;
import com.cloudbuilder.shared.event.domain.DriftDetectedEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for drift detection events (ADR-035 dual-mode).
 *
 * <p>Active when {@code cloudbuilder.kafka.enabled=true}.
 * Uses Inbox Pattern for deduplication before processing.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class DriftEventListenerKafka {

    private static final Logger log = LoggerFactory.getLogger(DriftEventListenerKafka.class);

    private final HealthCheckService healthCheckService;
    private final InboxProcessor inboxProcessor;

    public DriftEventListenerKafka(HealthCheckService healthCheckService,
                                   InboxProcessor inboxProcessor) {
        this.healthCheckService = healthCheckService;
        this.inboxProcessor = inboxProcessor;
    }

    @KafkaListener(
        topics = "${cloudbuilder.kafka.topics.observability:observability.events}",
        groupId = "cloudbuilder-drift-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onDriftDetected(ConsumerRecord<String, Object> record) {
        if (!(record.value() instanceof DriftDetectedEvent event)) return;
        if (!inboxProcessor.tryAcquire(event.getEventId(), event.getEventType(), event.getTenantId())) return;

        if (event.hasDrift()) {
            log.warn("Kafka drift detected: {} resources drifted in environment {}",
                event.driftCount(), event.environmentId());
            healthCheckService.recordHealth(
                "drift-detector",
                event.environmentId(),
                "degraded",
                0.0,
                0.0
            );
        } else {
            log.info("Kafka drift resolved in environment {}", event.environmentId());
            healthCheckService.recordHealth(
                "drift-detector",
                event.environmentId(),
                "healthy",
                0.0,
                100.0
            );
        }
    }
}
