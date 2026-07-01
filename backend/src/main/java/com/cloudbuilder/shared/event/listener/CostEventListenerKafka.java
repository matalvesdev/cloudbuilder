package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.observe.domain.service.HealthCheckService;
import com.cloudbuilder.shared.event.config.InboxProcessor;
import com.cloudbuilder.shared.event.domain.CostAnomalyEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for cost-related events (ADR-035 dual-mode).
 *
 * <p>Active when {@code cloudbuilder.kafka.enabled=true}.
 * Uses Inbox Pattern for deduplication before processing.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class CostEventListenerKafka {

    private static final Logger log = LoggerFactory.getLogger(CostEventListenerKafka.class);

    private final HealthCheckService healthCheckService;
    private final InboxProcessor inboxProcessor;

    public CostEventListenerKafka(HealthCheckService healthCheckService,
                                  InboxProcessor inboxProcessor) {
        this.healthCheckService = healthCheckService;
        this.inboxProcessor = inboxProcessor;
    }

    @KafkaListener(
        topics = "${cloudbuilder.kafka.topics.cost:cost.events}",
        groupId = "cloudbuilder-cost-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onCostAnomaly(ConsumerRecord<String, Object> record) {
        if (!(record.value() instanceof CostAnomalyEvent event)) return;
        if (!inboxProcessor.tryAcquire(event.getEventId(), event.getEventType(), event.getTenantId())) return;

        log.warn("Kafka cost anomaly: ${} exceed threshold ${} in environment {}",
            String.format("%.2f", event.currentSpend()),
            String.format("%.2f", event.threshold()),
            event.environmentId());

        healthCheckService.recordHealth(
            "cost-monitor",
            event.environmentId(),
            "degraded",
            0.0,
            0.0
        );
    }
}
