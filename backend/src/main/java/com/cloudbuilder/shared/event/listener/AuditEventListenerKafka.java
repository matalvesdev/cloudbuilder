package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.audit.domain.service.AuditService;
import com.cloudbuilder.shared.event.config.InboxProcessor;
import com.cloudbuilder.shared.event.domain.AuditTrailEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for audit trail events (ADR-035 dual-mode).
 *
 * <p>Active when {@code cloudbuilder.kafka.enabled=true}.
 * Records all audit-relevant events to the audit_events table for compliance trail.
 * Uses Inbox Pattern for deduplication before processing.
 *
 * <p>Topic: audit.events
 * <p>GroupId: cloudbuilder-audit-listener
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class AuditEventListenerKafka {

    private static final Logger log = LoggerFactory.getLogger(AuditEventListenerKafka.class);

    private final AuditService auditService;
    private final InboxProcessor inboxProcessor;

    public AuditEventListenerKafka(AuditService auditService, InboxProcessor inboxProcessor) {
        this.auditService = auditService;
        this.inboxProcessor = inboxProcessor;
    }

    @KafkaListener(
        topics = "${cloudbuilder.kafka.topics.audit:audit.events}",
        groupId = "cloudbuilder-audit-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onAuditTrail(ConsumerRecord<String, Object> record) {
        if (!(record.value() instanceof AuditTrailEvent event)) return;
        if (!inboxProcessor.tryAcquire(event.getEventId(), event.getEventType(), event.getTenantId())) return;

        log.info("Kafka audit trail: action={} resource={}/{} user={}",
            event.action(), event.resourceType(), event.resourceId(), event.userId());

        auditService.recordEvent(
            event.tenantId(),
            event.userId(),
            event.action(),
            event.resourceType(),
            event.resourceId(),
            event.details(),
            event.ipAddress()
        );
    }
}
