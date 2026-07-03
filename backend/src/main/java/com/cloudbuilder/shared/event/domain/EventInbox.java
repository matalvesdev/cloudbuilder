package com.cloudbuilder.shared.event.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * EventInbox: Deduplication store for Kafka consumers (Inbox Pattern).
 * Tracks processed event IDs to prevent duplicate processing.
 */
@Entity
@Table(name = "event_inbox", indexes = {
    @Index(name = "idx_inbox_event_id", columnList = "eventId"),
    @Index(name = "idx_inbox_tenant", columnList = "tenantId")
})
public class EventInbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true)
    private String eventId;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "topic")
    private String topic;

    @Column(name = "partition")
    private int partition;

    @Column(name = "offset")
    private long offset;

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected EventInbox() {}

    public EventInbox(String eventId, String tenantId, String eventType, String topic, int partition, long offset) {
        this.eventId = eventId;
        this.tenantId = tenantId;
        this.eventType = eventType;
        this.topic = topic;
        this.partition = partition;
        this.offset = offset;
        this.processedAt = Instant.now();
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEventId() { return eventId; }
    public String getTenantId() { return tenantId; }
    public String getEventType() { return eventType; }
    public String getTopic() { return topic; }
    public int getPartition() { return partition; }
    public long getOffset() { return offset; }
    public Instant getProcessedAt() { return processedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
