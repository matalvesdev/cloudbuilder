package com.cloudbuilder.shared.event.web;

import com.cloudbuilder.shared.event.PlatformEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Bridges Kafka-consumed events back to Spring's ApplicationEventPublisher
 * so that EventStreamController (via @EventListener) can broadcast them to SSE.
 *
 * <p>Only active when {@code cloudbuilder.kafka.enabled=true}.
 * This keeps the EventStreamController clean and Kafka-agnostic.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class EventStreamKafkaBridge {

    private static final Logger log = LoggerFactory.getLogger(EventStreamKafkaBridge.class);

    private final ApplicationEventPublisher eventPublisher;

    public EventStreamKafkaBridge(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @KafkaListener(
        topics = {
            "${cloudbuilder.kafka.topics.canvas:canvas.events}",
            "${cloudbuilder.kafka.topics.deployment:deployment.events}",
            "${cloudbuilder.kafka.topics.observability:observability.events}",
            "${cloudbuilder.kafka.topics.ai:ai.events}",
            "${cloudbuilder.kafka.topics.cost:cost.events}",
            "${cloudbuilder.kafka.topics.security:security.events}",
            "${cloudbuilder.kafka.topics.identity:identity.events}",
            "${cloudbuilder.kafka.topics.audit:audit.events}",
            "${cloudbuilder.kafka.topics.policy:policy.events}",
            "${cloudbuilder.kafka.topics.notification:notification.events}",
            "${cloudbuilder.kafka.topics.system:system.events}",
            "${cloudbuilder.kafka.topics.provisioning:provisioning.events}"
        },
        groupId = "cloudbuilder-sse-bridge",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onKafkaEvent(ConsumerRecord<String, Object> record) {
        if (record.value() instanceof PlatformEvent event) {
            // Re-publish to Spring event bus so EventStreamController picks it up
            eventPublisher.publishEvent(event);
        }
    }
}
