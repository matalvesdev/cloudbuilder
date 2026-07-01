package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Publishes PlatformEvents to Kafka via KafkaTemplate.
 *
 * <p>Uses event's tenantId + eventId as the Kafka key for partition affinity,
 * ensuring all events from the same tenant go to the same partition (ordered).
 *
 * <p>Called by OutboxSweeper (retry path) and can be called directly
 * for fire-and-forget publishing alongside Spring's ApplicationEventPublisher.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class KafkaEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventPublisher.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final TopicRouter topicRouter;
    private final EventMetrics eventMetrics;

    public KafkaEventPublisher(KafkaTemplate<String, Object> kafkaTemplate,
                               TopicRouter topicRouter,
                               EventMetrics eventMetrics) {
        this.kafkaTemplate = kafkaTemplate;
        this.topicRouter = topicRouter;
        this.eventMetrics = eventMetrics;
    }

    /**
     * Publishes a PlatformEvent to the appropriate Kafka topic.
     *
     * @param event the platform event to publish
     * @return CompletableFuture with the send result
     */
    public CompletableFuture<SendResult<String, Object>> publish(PlatformEvent event) {
        String topic = topicRouter.resolveTopic(event.getEventType());
        // Partition key: tenantId + eventId for ordering within tenant
        String key = event.getTenantId() + ":" + event.getEventId();

        return kafkaTemplate.send(topic, key, event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Kafka publish FAILED: topic={}, eventType={}, error={}",
                        topic, event.getEventType(), ex.getMessage());
                } else {
                    log.debug("Kafka published: topic={}, eventType={}, partition={}, offset={}",
                        topic, event.getEventType(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
                    eventMetrics.recordPublished();
                }
            });
    }
}
