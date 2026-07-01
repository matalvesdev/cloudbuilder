package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import com.cloudbuilder.shared.event.domain.EventOutbox;
import com.cloudbuilder.shared.event.domain.EventOutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;

/**
 * Scheduled sweeper for the transactional outbox pattern.
 *
 * - Every 30 seconds, retries PENDING entries (from crashes or failures)
 * - Every hour, cleans up PROCESSED entries older than 24h
 *
 * <p>When Kafka is enabled, publishes to Kafka via {@link KafkaEventPublisher}.
 * When Kafka is disabled, falls back to Spring's ApplicationEventPublisher only.
 *
 * Disabled by default in tests: {@code cloudbuilder.outbox.sweeper.enabled=false}
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.outbox.sweeper.enabled", havingValue = "true", matchIfMissing = true)
public class OutboxSweeper {

    private static final Logger log = LoggerFactory.getLogger(OutboxSweeper.class);

    private static final Duration PROCESSED_RETENTION = Duration.ofHours(24);
    private static final int MAX_RETRY = 5;

    private final EventOutboxRepository outboxRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final EventMetrics eventMetrics;
    @Autowired(required = false)
    private KafkaEventPublisher kafkaEventPublisher;

    public OutboxSweeper(EventOutboxRepository outboxRepository,
                         ApplicationEventPublisher eventPublisher,
                         ObjectMapper objectMapper,
                         TransactionTemplate transactionTemplate,
                         EventMetrics eventMetrics) {
        this.outboxRepository = outboxRepository;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
        this.transactionTemplate = transactionTemplate;
        this.eventMetrics = eventMetrics;
    }

    /**
     * Retry unprocessed outbox entries every 30 seconds.
     * Event processing happens within a transaction so partial failures
     * don't leave the system in an inconsistent state.
     */
    @Scheduled(fixedRate = 30_000)
    public void sweepPending() {
        var pending = outboxRepository.findPendingOrderByCreatedAt();
        if (pending.isEmpty()) return;

        log.info("Outbox sweep: {} pending entries", pending.size());

        for (var entry : pending) {
            if (entry.getRetryCount() >= MAX_RETRY) {
                log.warn("Outbox entry {} exceeded max retries ({})", entry.getId(), MAX_RETRY);
                continue;
            }
            eventMetrics.recordOutboxSwept();

            transactionTemplate.executeWithoutResult(status -> {
                try {
                    Class<?> eventClass = Class.forName(entry.getEventClass());
                    Object event = objectMapper.readValue(entry.getPayload(), eventClass);
                    if (event instanceof PlatformEvent platformEvent) {
                        // Publish to Kafka (primary path when enabled)
                        if (kafkaEventPublisher != null) {
                            kafkaEventPublisher.publish(platformEvent);
                        }
                        // Also publish to local Spring event bus (for @EventListener fallback + SSE bridge)
                        eventPublisher.publishEvent(platformEvent);
                        entry.markPublished();
                        outboxRepository.save(entry);
                        log.info("Outbox retry published: {} [{}]", entry.getEventType(), entry.getId());
                    }
                } catch (ClassNotFoundException | java.io.IOException e) {
                    entry.markFailed(e.getMessage());
                    outboxRepository.save(entry);
                    log.error("Outbox retry failed: {} [{}] - {}",
                        entry.getEventType(), entry.getId(), e.getMessage());
                }
            });
        }
    }

    /**
     * Clean up processed entries older than 24 hours.
     * Runs every hour to prevent unbounded table growth.
     */
    @Scheduled(fixedRate = 3_600_000)
    public void sweepProcessed() {
        Instant cutoff = Instant.now().minus(PROCESSED_RETENTION);
        int deleted = outboxRepository.deleteProcessedOlderThan(cutoff);
        if (deleted > 0) {
            log.info("Outbox cleanup: removed {} processed entries older than {}", deleted, cutoff);
            eventMetrics.recordOutboxCleaned();
        }
    }
}
