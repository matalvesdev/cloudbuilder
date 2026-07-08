package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Routes platform events to appropriate Kafka topics based on event type prefix.
 */
@Component
public class TopicRouter {

    private static final Map<String, String> TOPIC_MAP = Map.of(
        "canvas.", "canvas.events",
        "deployment.", "deployment.events",
        "drift.", "drift.events",
        "cost.", "cost.events",
        "incident.", "incident.events",
        "health.", "health.events",
        "notification.", "notification.events",
        "audit.", "audit.events",
        "credential.", "credential.events",
        "provision.", "provision.events"
    );

    private static final String DEFAULT_TOPIC = "platform.events";

    /**
     * Resolve the Kafka topic for a given event type.
     */
    public String resolveTopic(String eventType) {
        if (eventType == null) return DEFAULT_TOPIC;
        for (var entry : TOPIC_MAP.entrySet()) {
            if (eventType.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return DEFAULT_TOPIC;
    }

    /**
     * Resolve the Kafka topic for a PlatformEvent.
     */
    public String resolveTopic(PlatformEvent event) {
        return resolveTopic(event.getEventType());
    }

    /**
     * Resolve the Kafka topic by event type name (used by OutboxSweeper).
     */
    public String resolveTopicByName(String eventType) {
        return resolveTopic(eventType);
    }
}
