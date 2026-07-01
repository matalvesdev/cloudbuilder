package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.audit.domain.service.AuditService;
import com.cloudbuilder.shared.event.config.InboxProcessor;
import com.cloudbuilder.shared.event.domain.CanvasEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for canvas design change events (ADR-035 dual-mode).
 *
 * <p>Active when {@code cloudbuilder.kafka.enabled=true}.
 * Records all canvas mutations to the audit trail for compliance and change tracking.
 * Uses Inbox Pattern for deduplication before processing.
 *
 * <p>Topic: canvas.events
 * <p>GroupId: cloudbuilder-canvas-listener
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class CanvasEventListenerKafka {

    private static final Logger log = LoggerFactory.getLogger(CanvasEventListenerKafka.class);

    private final AuditService auditService;
    private final InboxProcessor inboxProcessor;

    public CanvasEventListenerKafka(AuditService auditService, InboxProcessor inboxProcessor) {
        this.auditService = auditService;
        this.inboxProcessor = inboxProcessor;
    }

    @KafkaListener(
        topics = "${cloudbuilder.kafka.topics.canvas:canvas.events}",
        groupId = "cloudbuilder-canvas-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onCanvasEvent(ConsumerRecord<String, Object> record) {
        if (!(record.value() instanceof CanvasEvent event)) return;
        if (!inboxProcessor.tryAcquire(event.getEventId(), event.getEventType(), event.getTenantId())) return;

        log.info("Kafka canvas event: action={} canvas={} user={}",
            event.canvasAction(), event.canvasId(), event.userId());

        // Build details string based on action type
        String details = switch (event.canvasAction().toLowerCase()) {
            case "created" -> "Canvas created";
            case "updated" -> "Canvas updated";
            case "deleted" -> "Canvas deleted";
            case "node.added" -> "Node added: " + event.nodeId();
            case "node.removed" -> "Node removed: " + event.nodeId();
            case "edge.added" -> "Edge added: " + event.edgeId();
            case "edge.removed" -> "Edge removed: " + event.edgeId();
            default -> "Canvas action: " + event.canvasAction();
        };

        // Record in audit trail for compliance
        auditService.recordEvent(
            event.tenantId(),
            event.userId(),
            "canvas." + event.canvasAction(),
            "canvas",
            event.canvasId(),
            details,
            null
        );
    }
}
