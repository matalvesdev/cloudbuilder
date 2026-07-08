package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Publishes platform events to Kafka topics.
 * Only active when cloudbuilder.kafka.enabled=true.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true")
public class KafkaEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final TopicRouter topicRouter;
    private final ObjectMapper objectMapper;

    public KafkaEventPublisher(KafkaTemplate<String, String> kafkaTemplate,
                                TopicRouter topicRouter,
                                ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.topicRouter = topicRouter;
        this.objectMapper = objectMapper;
    }

    /**
     * Publish a platform event to the appropriate Kafka topic.
     */
    public CompletableFuture<SendResult<String, String>> publish(PlatformEvent event) {
        try {
            String topic = topicRouter.resolveTopic(event);
            String key = event.getEventId();
            String value = objectMapper.writeValueAsString(event);

            log.debug("Publishing event {} to topic {}", event.getEventType(), topic);
            return kafkaTemplate.send(topic, key, value);
        } catch (Exception e) {
            log.error("Failed to publish event: {}", event.getEventType(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Publish a raw JSON payload to the appropriate Kafka topic.
     * Used by OutboxSweeper to re-publish persisted events without deserialization.
     */
    public CompletableFuture<SendResult<String, String>> publishRaw(
            String eventType, String eventId, String payload) {
        try {
            String topic = topicRouter.resolveTopicByName(eventType);

            log.debug("Publishing raw event {} to topic {}", eventType, topic);
            return kafkaTemplate.send(topic, eventId, payload);
        } catch (Exception e) {
            log.error("Failed to publish raw event: {}", eventType, e);
            return CompletableFuture.failedFuture(e);
        }
    }
}
