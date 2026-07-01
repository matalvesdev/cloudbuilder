package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.domain.DlqEvent;
import com.cloudbuilder.shared.event.domain.DlqEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Dead Letter Queue handler (ADR-035).
 *
 * <p>Consumes events from {@code *.events.dlq} topics and persists them
 * to the {@code dlq_events} table for manual inspection and replay.
 *
 * <p>Disabled when Kafka is off ({@code cloudbuilder.kafka.enabled=false}).
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class DLQHandler {

    private static final Logger log = LoggerFactory.getLogger(DLQHandler.class);

    private final DlqEventRepository dlqEventRepository;
    private final ObjectMapper objectMapper;
    private final EventMetrics eventMetrics;

    public DLQHandler(DlqEventRepository dlqEventRepository,
                      ObjectMapper objectMapper,
                      EventMetrics eventMetrics) {
        this.dlqEventRepository = dlqEventRepository;
        this.objectMapper = objectMapper;
        this.eventMetrics = eventMetrics;
    }

    @KafkaListener(
        topicPattern = ".*\\.events\\.dlq",
        groupId = "cloudbuilder-dlq",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleDlq(ConsumerRecord<String, Object> record) {
        try {
            String payload = objectMapper.writeValueAsString(record.value());
            String tenantId = null;
            if (record.value() instanceof com.cloudbuilder.shared.event.PlatformEvent pe) {
                tenantId = pe.getTenantId();
            }

            var dlqEvent = new DlqEvent(
                record.topic() + "-" + record.partition() + "-" + record.offset(),
                record.topic().replace(".dlq", ""),
                record.partition(),
                record.offset(),
                payload,
                "Max retries exceeded (DLQ routing)",
                tenantId
            );

            dlqEventRepository.save(dlqEvent);
            eventMetrics.recordListenerFailure();
            log.warn("DLQ event persisted: topic={}, partition={}, offset={}, tenant={}",
                record.topic(), record.partition(), record.offset(), tenantId);
        } catch (Exception e) {
            log.error("Failed to persist DLQ event: {}", e.getMessage());
        }
    }
}
