package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.shared.event.domain.DlqEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * DLQHandler: Consumes events from dead letter queues for monitoring and reprocessing.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true")
public class DLQHandler {

    private static final Logger log = LoggerFactory.getLogger(DLQHandler.class);

    @KafkaListener(topics = {
        "canvas.events.dlq", "deployment.events.dlq", "drift.events.dlq",
        "cost.events.dlq", "incident.events.dlq", "health.events.dlq",
        "platform.events.dlq"
    }, groupId = "cloudbuilder-dlq")
    public void onDlqMessage(String message) {
        log.warn("DLQ message received: {}", message.substring(0, Math.min(200, message.length())));
        // In production: store in dlq_events table, trigger alerting
    }
}
