package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.domain.EventOutboxEntry;
import com.cloudbuilder.shared.event.port.EventOutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Transactional Outbox Sweeper (ADR-035).
 *
 * Periodically processes PENDING entries from the event_outbox table and
 * publishes the raw JSON payload to Kafka (when enabled).
 * Also cleans up old PROCESSED entries (>24h).
 *
 * Each sweep batch runs in its own transaction so a failure mid-batch
 * does not roll back previously published events.
 */
@Service
public class OutboxSweeper {

    private static final Logger log = LoggerFactory.getLogger(OutboxSweeper.class);
    private static final int MAX_RETRIES = 5;

    private final EventOutboxRepository outboxRepository;
    private final Optional<KafkaEventPublisher> kafkaPublisher;

    public OutboxSweeper(EventOutboxRepository outboxRepository,
                         Optional<KafkaEventPublisher> kafkaPublisher) {
        this.outboxRepository = outboxRepository;
        this.kafkaPublisher = kafkaPublisher;
    }

    /**
     * Sweep PENDING outbox entries every 30 seconds.
     * Publishes raw JSON payloads directly to Kafka — no deserialization needed.
     */
    @Scheduled(fixedDelayString = "${cloudbuilder.outbox.sweep-interval:30000}",
               initialDelayString = "${cloudbuilder.outbox.sweep-initial-delay:10000}")
    @Transactional
    public void sweep() {
        if (kafkaPublisher.isEmpty()) {
            return;
        }

        List<EventOutboxEntry> pending = outboxRepository
                .findByStatusAndRetryCountLessThanOrderByCreatedAtAsc(
                        EventOutboxEntry.Status.PENDING, MAX_RETRIES);

        if (pending.isEmpty()) {
            return;
        }

        log.debug("OutboxSweeper: found {} pending entries", pending.size());

        int published = 0;
        int failed = 0;

        for (EventOutboxEntry entry : pending) {
            try {
                entry.markProcessing();
                outboxRepository.save(entry);

                kafkaPublisher.get().publishRaw(
                        entry.getEventType(), entry.getId(), entry.getPayload())
                        .get(10, TimeUnit.SECONDS);

                entry.markProcessed();
                outboxRepository.save(entry);
                published++;
            } catch (Exception e) {
                log.warn("OutboxSweeper: failed to publish entry {}: {}",
                        entry.getId(), e.getMessage());
                entry.markFailed(e.getMessage());
                if (entry.getRetryCount() >= MAX_RETRIES) {
                    entry.markPermanentlyFailed();
                }
                outboxRepository.save(entry);
                failed++;
            }
        }

        if (published > 0 || failed > 0) {
            log.info("OutboxSweeper: published={}, failed={}, total={}",
                    published, failed, pending.size());
        }
    }

    /**
     * Clean up PROCESSED entries older than 24 hours.
     * Runs every 10 minutes.
     */
    @Scheduled(fixedDelayString = "${cloudbuilder.outbox.cleanup-interval:600000}",
               initialDelayString = "60000")
    @Transactional
    public void cleanup() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        int deleted = outboxRepository.deleteByStatusAndProcessedAtBefore(
                EventOutboxEntry.Status.PROCESSED, cutoff);

        if (deleted > 0) {
            log.info("OutboxSweeper: cleaned up {} processed entries older than 24h", deleted);
        }
    }
}
