package com.cloudbuilder.shared.event.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * DlqEvent: Dead Letter Queue for failed event processing.
 * Stores events that failed processing after max retries.
 */
@Entity
@Table(name = "dlq_events", indexes = {
    @Index(name = "idx_dlq_events_topic", columnList = "original_topic"),
    @Index(name = "idx_dlq_events_failed", columnList = "failed_at")
})
public class DlqEvent {

    @Id
    private String id;

    @Column(name = "event_id")
    private String eventId;

    @Column(name = "original_topic", nullable = false)
    private String topic;

    @Column(name = "original_partition", nullable = false)
    private int partition;

    @Column(name = "original_offset", nullable = false)
    private long offsetVal;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "retry_count")
    private int retryCount;

    @Column(name = "failed_at", nullable = false)
    private Instant createdAt;

    protected DlqEvent() {}

    public DlqEvent(String eventId, String topic, int partition, long offsetVal,
                    String payload, String errorMessage, int retryCount) {
        this.id = UUID.randomUUID().toString();
        this.eventId = eventId;
        this.topic = topic;
        this.partition = partition;
        this.offsetVal = offsetVal;
        this.payload = payload;
        this.errorMessage = errorMessage;
        this.retryCount = retryCount;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getEventId() { return eventId; }
    public String getTopic() { return topic; }
    public int getPartition() { return partition; }
    public long getOffsetVal() { return offsetVal; }
    public String getPayload() { return payload; }
    public String getErrorMessage() { return errorMessage; }
    public int getRetryCount() { return retryCount; }
    public Instant getCreatedAt() { return createdAt; }
}
