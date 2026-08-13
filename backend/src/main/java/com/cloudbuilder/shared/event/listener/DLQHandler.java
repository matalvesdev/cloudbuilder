package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.shared.event.domain.DlqEvent;
import com.cloudbuilder.shared.event.port.DlqEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * DLQHandler: Consumes events from dead letter queues for monitoring and reprocessing.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true")
public class DLQHandler {

    private static final Logger log = LoggerFactory.getLogger(DLQHandler.class);
    private final DlqEventRepository repository;

    public DLQHandler(DlqEventRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = {
        "canvas.events.dlq", "deployment.events.dlq", "drift.events.dlq",
        "cost.events.dlq", "incident.events.dlq", "health.events.dlq",
        "platform.events.dlq"
    }, groupId = "cloudbuilder-dlq")
    public void onDlqMessage(
            String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {
        log.warn("DLQ message received: {}", message.substring(0, Math.min(200, message.length())));
        String eventId = UUID.nameUUIDFromBytes(message.getBytes(StandardCharsets.UTF_8)).toString();
        String originalTopic = topic.endsWith(".dlq")
                ? topic.substring(0, topic.length() - 4)
                : topic;
        repository.save(new DlqEvent(
                eventId,
                originalTopic,
                partition,
                offset,
                message,
                "Excedeu o limite de tentativas do consumidor Kafka",
                0));
    }
}
