package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.shared.event.domain.EventInbox;
import com.cloudbuilder.shared.event.port.EventInboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * InboxProcessor: Deduplication logic for Kafka consumers.
 * Uses the database so deduplication survives restarts and works across replicas.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true")
public class InboxProcessor {

    private static final Logger log = LoggerFactory.getLogger(InboxProcessor.class);

    private final EventInboxRepository repository;

    public InboxProcessor(EventInboxRepository repository) {
        this.repository = repository;
    }

    public void markProcessed(String eventId, String tenantId, String eventType,
                              String topic, int partition, long offset) {
        repository.save(new EventInbox(
                eventId, tenantId, eventType, topic, partition, offset));
    }

    /**
     * Check if an event has already been processed.
     */
    public boolean isProcessed(String eventId) {
        return repository.existsById(eventId);
    }

    public long getProcessedCount() {
        return repository.count();
    }
}
