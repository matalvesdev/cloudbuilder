package com.cloudbuilder.shared.event.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Inbox entity for event deduplication (Inbox Pattern — ADR-035).
 *
 * <p>When a Kafka consumer receives an event, it first checks this table.
 * If the eventId already exists, the event is a duplicate and is skipped.
 * If not, the eventId is inserted and processing proceeds.
 *
 * <p>Prevents duplicate processing from Kafka retries, consumer rebalances,
 * or at-least-once delivery guarantees.
 */
@Entity
@Table(name = "event_inbox")
public class EventInbox {

    @Id
    @Column(name = "event_id", length = 100)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "tenant_id", length = 36)
    private String tenantId;

    protected EventInbox() {}

    public EventInbox(String eventId, String eventType, String tenantId) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.tenantId = tenantId;
        this.processedAt = Instant.now();
        this.status = "PROCESSED";
    }

    public String getEventId() { return eventId; }
    public String getEventType() { return eventType; }
    public Instant getProcessedAt() { return processedAt; }
    public String getStatus() { return status; }
    public String getTenantId() { return tenantId; }
}
