package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.audit.domain.service.AuditService;
import com.cloudbuilder.shared.event.config.InboxProcessor;
import com.cloudbuilder.shared.event.domain.NotificationEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for notification events (ADR-035 dual-mode).
 *
 * <p>Active when {@code cloudbuilder.kafka.enabled=true}.
 * Dispatches notifications through configured channels and records audit trail.
 * Uses Inbox Pattern for deduplication before processing.
 *
 * <p>Topic: notification.events
 * <p>GroupId: cloudbuilder-notification-listener
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationEventListenerKafka {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListenerKafka.class);

    private final AuditService auditService;
    private final InboxProcessor inboxProcessor;

    public NotificationEventListenerKafka(AuditService auditService, InboxProcessor inboxProcessor) {
        this.auditService = auditService;
        this.inboxProcessor = inboxProcessor;
    }

    @KafkaListener(
        topics = "${cloudbuilder.kafka.topics.notification:notification.events}",
        groupId = "cloudbuilder-notification-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onNotification(ConsumerRecord<String, Object> record) {
        if (!(record.value() instanceof NotificationEvent event)) return;
        if (!inboxProcessor.tryAcquire(event.getEventId(), event.getEventType(), event.getTenantId())) return;

        log.info("Kafka notification: type={} severity={} title={} target={}",
            event.notificationType(), event.severity(), event.title(), event.targetUserId());

        // Record in audit trail for compliance
        auditService.recordEvent(
            event.tenantId(),
            event.targetUserId(),
            "notification." + event.notificationType(),
            "notification",
            event.eventId(),
            "Title: " + event.title() + ", Severity: " + event.severity() + ", Message: " + event.message(),
            null
        );

        // TODO: Dispatch through NotificationChannelRepository channels
        // (email, webhook, Slack, etc.) — currently logs only
        // Future: inject NotificationService and call sendToChannels()
    }
}
