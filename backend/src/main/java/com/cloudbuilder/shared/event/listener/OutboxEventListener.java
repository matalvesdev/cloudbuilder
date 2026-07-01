package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.shared.event.PlatformEvent;
import com.cloudbuilder.shared.event.domain.EventOutbox;
import com.cloudbuilder.shared.event.domain.EventOutboxRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Persists every PlatformEvent to the transactional outbox BEFORE
 * async business listeners process it.
 *
 * Order = 0 ensures this runs first (lowest precedence wins in Spring).
 * The outbox entry is written in the same publisher thread (sync=false),
 * so if the DB write fails, the entire operation rolls back.
 *
 * This guarantees at-least-once delivery: if the JVM crashes after
 * the business transaction commits but before async listeners run,
 * the OutboxSweeper will retry the PENDING entry.
 */
@Component
public class OutboxEventListener {

    private static final Logger log = LoggerFactory.getLogger(OutboxEventListener.class);

    private final EventOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public OutboxEventListener(EventOutboxRepository outboxRepository,
                               ObjectMapper objectMapper) {
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
    }

    @EventListener
    @Order(0)
    public void onPlatformEvent(PlatformEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            var outbox = new EventOutbox(
                event.getEventType(),
                event.getClass().getName(),
                payload,
                event.getTenantId()
            );
            outboxRepository.save(outbox);
            log.debug("Outbox persisted: {} [{}]", event.getEventType(), outbox.getId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event to outbox: {} - {}",
                event.getEventType(), e.getMessage());
        }
    }
}
