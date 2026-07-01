package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.domain.EventInbox;
import com.cloudbuilder.shared.event.domain.EventInboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Inbox processor for event deduplication (Inbox Pattern — ADR-035).
 *
 * <p>Before processing a Kafka-consumed event, call {@link #tryAcquire} to
 * check if the eventId has already been processed. If not, it inserts the
 * record and returns true (proceed with processing). If yes, returns false
 * (skip — duplicate event).
 *
 * <p>Also runs periodic cleanup of old inbox entries (older than 7 days).
 */
@Component
public class InboxProcessor {

    private static final Logger log = LoggerFactory.getLogger(InboxProcessor.class);

    private final EventInboxRepository inboxRepository;

    public InboxProcessor(EventInboxRepository inboxRepository) {
        this.inboxRepository = inboxRepository;
    }

    /**
     * Try to acquire the event for processing.
     *
     * @return true if this is a new event (caller should process it);
     *         false if it's a duplicate (caller should skip it)
     */
    public boolean tryAcquire(String eventId, String eventType, String tenantId) {
        if (inboxRepository.existsByEventId(eventId)) {
            log.debug("Duplicate event skipped: {} [{}]", eventType, eventId);
            return false;
        }
        inboxRepository.save(new EventInbox(eventId, eventType, tenantId));
        return true;
    }

    /**
     * Cleanup processed inbox entries older than 7 days.
     * Runs every hour.
     */
    @Scheduled(fixedRate = 3_600_000)
    public void cleanup() {
        Instant cutoff = Instant.now().minus(7, ChronoUnit.DAYS);
        int deleted = inboxRepository.deleteOlderThan(cutoff);
        if (deleted > 0) {
            log.info("EventInbox cleanup: removed {} entries older than 7 days", deleted);
        }
    }
}
