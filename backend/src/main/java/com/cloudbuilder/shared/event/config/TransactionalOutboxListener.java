package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import com.cloudbuilder.shared.event.domain.EventOutboxEntry;
import com.cloudbuilder.shared.event.domain.KafkaBridgedEvent;
import com.cloudbuilder.shared.event.port.EventOutboxRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Captures domain events in the same database transaction that produced them.
 * Delivery is delegated to {@link OutboxSweeper}; events received from Kafka
 * are excluded to prevent a bridge loop.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true")
public class TransactionalOutboxListener {

    private final EventOutboxRepository repository;
    private final ObjectMapper objectMapper;

    public TransactionalOutboxListener(EventOutboxRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @TransactionalEventListener
    public void capture(PlatformEvent event) {
        if (event instanceof KafkaBridgedEvent) {
            return;
        }

        try {
            repository.save(new EventOutboxEntry(
                    event.getEventId(),
                    event.getEventType(),
                    event.getClass().getName(),
                    objectMapper.writeValueAsString(event),
                    event.getTenantId()));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Não foi possível serializar o evento " + event.getEventType(), exception);
        }
    }
}
