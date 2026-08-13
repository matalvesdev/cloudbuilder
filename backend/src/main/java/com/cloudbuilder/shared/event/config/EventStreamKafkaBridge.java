package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import com.cloudbuilder.shared.event.domain.KafkaBridgedEvent;
import com.cloudbuilder.shared.event.listener.InboxProcessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true")
public class EventStreamKafkaBridge {
    private static final Logger log = LoggerFactory.getLogger(EventStreamKafkaBridge.class);
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final InboxProcessor inboxProcessor;
    private static final Map<String, String> TOPIC_EVENT_MAP = new HashMap<>();

    static {
        TOPIC_EVENT_MAP.put("canvas.events", "canvas");
        TOPIC_EVENT_MAP.put("deployment.events", "deployment");
        TOPIC_EVENT_MAP.put("drift.events", "drift");
        TOPIC_EVENT_MAP.put("cost.events", "cost");
        TOPIC_EVENT_MAP.put("incident.events", "incident");
        TOPIC_EVENT_MAP.put("health.events", "health");
        TOPIC_EVENT_MAP.put("notification.events", "notification");
        TOPIC_EVENT_MAP.put("audit.events", "audit");
        TOPIC_EVENT_MAP.put("credential.events", "credential");
        TOPIC_EVENT_MAP.put("provision.events", "provision");
        TOPIC_EVENT_MAP.put("platform.events", "platform");
    }

    public EventStreamKafkaBridge(ApplicationEventPublisher eventPublisher,
                                  ObjectMapper objectMapper,
                                  InboxProcessor inboxProcessor) {
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
        this.inboxProcessor = inboxProcessor;
    }

    @KafkaListener(topics = {
        "canvas.events", "deployment.events", "drift.events",
        "cost.events", "incident.events", "health.events",
        "notification.events", "audit.events", "credential.events",
        "provision.events", "platform.events"
    }, groupId = "cloudbuilder-bridge")
    @Transactional
    public void onMessage(
            String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {
        try {
            log.debug("Bridging Kafka message from topic {} to Spring event bus", topic);
            Map<String, Object> payload;
            try {
                payload = objectMapper.readValue(message, Map.class);
            } catch (Exception e) {
                throw new IllegalArgumentException(
                        "Invalid Kafka event payload from topic " + topic, e);
            }

            String eventType = (String) payload.get("eventType");
            if (eventType == null) {
                eventType = TOPIC_EVENT_MAP.getOrDefault(topic, "unknown");
            }

            String tenantId = payload.get("tenantId") != null ? payload.get("tenantId").toString() : "";
            String eventId = payload.get("eventId") != null
                    ? payload.get("eventId").toString()
                    : UUID.nameUUIDFromBytes(message.getBytes(StandardCharsets.UTF_8)).toString();

            if (inboxProcessor.isProcessed(eventId)) {
                log.debug("Skipping duplicate Kafka event {}", eventId);
                return;
            }

            PlatformEvent platformEvent = new KafkaBridgedEvent(
                    eventId, eventType, tenantId, Instant.now());

            eventPublisher.publishEvent(platformEvent);
            inboxProcessor.markProcessed(
                    eventId, tenantId, eventType, topic, partition, offset);
            log.debug("Bridged Kafka message to Spring event bus: {}", eventType);
        } catch (Exception e) {
            log.error("Failed to bridge Kafka message from topic {}: {}", topic, e.getMessage(), e);
            if (e instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new IllegalStateException("Kafka event bridge failed", e);
        }
    }
}
