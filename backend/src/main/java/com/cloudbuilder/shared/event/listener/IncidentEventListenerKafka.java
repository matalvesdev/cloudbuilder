package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.audit.domain.service.AuditService;
import com.cloudbuilder.observability.domain.service.MetricsService;
import com.cloudbuilder.shared.event.config.InboxProcessor;
import com.cloudbuilder.shared.event.domain.IncidentEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Kafka consumer for incident lifecycle events (ADR-035 dual-mode).
 *
 * <p>Active when {@code cloudbuilder.kafka.enabled=true}.
 * Uses Inbox Pattern for deduplication before processing.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class IncidentEventListenerKafka {

    private static final Logger log = LoggerFactory.getLogger(IncidentEventListenerKafka.class);

    private final AuditService auditService;
    private final MetricsService metricsService;
    private final InboxProcessor inboxProcessor;

    public IncidentEventListenerKafka(AuditService auditService,
                                      MetricsService metricsService,
                                      InboxProcessor inboxProcessor) {
        this.auditService = auditService;
        this.metricsService = metricsService;
        this.inboxProcessor = inboxProcessor;
    }

    @KafkaListener(
        topics = "${cloudbuilder.kafka.topics.ai:ai.events}",
        groupId = "cloudbuilder-incident-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onIncident(ConsumerRecord<String, Object> record) {
        if (!(record.value() instanceof IncidentEvent event)) return;
        if (!inboxProcessor.tryAcquire(event.getEventId(), event.getEventType(), event.getTenantId())) return;

        if ("created".equalsIgnoreCase(event.status())) {
            log.warn("Kafka incident created: [{}] {} - {}",
                event.severity(), event.title(), event.incidentId());
            auditService.recordEvent(
                event.tenantId(),
                "system",
                "incident.created",
                "incident",
                event.incidentId(),
                "Severity: " + event.severity() + ", Source: " + event.source() + ", Title: " + event.title(),
                null
            );
        } else if ("resolved".equalsIgnoreCase(event.status())) {
            log.info("Kafka incident resolved: {} ({})", event.title(), event.incidentId());
            metricsService.record(
                "incident.resolution",
                1.0,
                event.tenantId(),
                Map.of(
                    "incidentId", event.incidentId(),
                    "severity", event.severity(),
                    "source", event.source()
                )
            );
        }
    }
}
