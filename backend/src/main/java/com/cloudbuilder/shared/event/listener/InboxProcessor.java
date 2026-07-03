package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.shared.event.domain.EventInbox;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * InboxProcessor: Deduplication logic for Kafka consumers.
 * Tracks processed event IDs in memory (production would use DB via EventInbox entity).
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true")
public class InboxProcessor {

    private static final Logger log = LoggerFactory.getLogger(InboxProcessor.class);

    private final Set<String> processedEvents = ConcurrentHashMap.newKeySet();

    /**
     * Try to acquire processing rights for an event.
     * Returns true if this is a new event that should be processed.
     */
    public boolean tryAcquire(String eventId) {
        return processedEvents.add(eventId);
    }

    /**
     * Mark an event as fully processed.
     */
    public void markProcessed(String eventId) {
        processedEvents.add(eventId);
    }

    /**
     * Check if an event has already been processed.
     */
    public boolean isProcessed(String eventId) {
        return processedEvents.contains(eventId);
    }

    public int getProcessedCount() {
        return processedEvents.size();
    }
}
