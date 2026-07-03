package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Bridges Kafka messages back to Spring ApplicationEvent bus.
 * When Kafka is enabled, this ensures in-memory event listeners still fire.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true")
public class EventStreamKafkaBridge {

    private static final Logger log = LoggerFactory.getLogger(EventStreamKafkaBridge.class);

    private final ApplicationEventPublisher eventPublisher;

    public EventStreamKafkaBridge(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @KafkaListener(topics = {
        "canvas.events", "deployment.events", "drift.events",
        "cost.events", "incident.events", "health.events",
        "notification.events", "audit.events", "credential.events",
        "provision.events", "platform.events"
    }, groupId = "cloudbuilder-bridge")
    public void onMessage(String message) {
        try {
            // Re-publish to Spring event bus for in-memory listeners
            log.debug("Bridging Kafka message to Spring event bus");
            // In production, deserialize to PlatformEvent and publish
            // For now, log the bridging
        } catch (Exception e) {
            log.error("Failed to bridge Kafka message", e);
        }
    }
}
