package com.cloudbuilder.shared.event.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * EventInbox: Deduplication store for Kafka consumers (Inbox Pattern).
 * Tracks processed event IDs to prevent duplicate processing.
 */
@Entity
@Table(name = "event_inbox", indexes = {
    @Index(name = "idx_inbox_tenant", columnList = "tenant_id")
})
public class EventInbox {

    @Id
    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "topic")
    private String topic;

    @Column(name = "partition_num")
    private int partition;

    @Column(name = "offset_val")
    private long kafkaOffset;

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected EventInbox() {}

    public EventInbox(String eventId, String tenantId, String eventType, String topic, int partition, long kafkaOffset) {
        this.eventId = eventId;
        this.tenantId = tenantId;
        this.eventType = eventType;
        this.topic = topic;
        this.partition = partition;
        this.kafkaOffset = kafkaOffset;
        this.processedAt = Instant.now();
        this.createdAt = Instant.now();
    }

    public String getId() { return eventId; }
    public String getEventId() { return eventId; }
    public String getTenantId() { return tenantId; }
    public String getEventType() { return eventType; }
    public String getTopic() { return topic; }
    public int getPartition() { return partition; }
    public long getKafkaOffset() { return kafkaOffset; }
    public Instant getProcessedAt() { return processedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
