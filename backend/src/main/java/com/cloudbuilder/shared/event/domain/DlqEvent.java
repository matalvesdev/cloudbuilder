package com.cloudbuilder.shared.event.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * DlqEvent: Dead Letter Queue for failed event processing.
 * Stores events that failed processing after max retries.
 */
@Entity
@Table(name = "dlq_events", indexes = {
    @Index(name = "idx_dlq_topic", columnList = "topic"),
    @Index(name = "idx_dlq_created", columnList = "createdAt")
})
public class DlqEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id")
    private String eventId;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "partition")
    private int partition;

    @Column(name = "offset_val")
    private long offsetVal;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "retry_count")
    private int retryCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected DlqEvent() {}

    public DlqEvent(String eventId, String topic, int partition, long offsetVal,
                    String payload, String errorMessage, int retryCount) {
        this.eventId = eventId;
        this.topic = topic;
        this.partition = partition;
        this.offsetVal = offsetVal;
        this.payload = payload;
        this.errorMessage = errorMessage;
        this.retryCount = retryCount;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEventId() { return eventId; }
    public String getTopic() { return topic; }
    public int getPartition() { return partition; }
    public long getOffsetVal() { return offsetVal; }
    public String getPayload() { return payload; }
    public String getErrorMessage() { return errorMessage; }
    public int getRetryCount() { return retryCount; }
    public Instant getCreatedAt() { return createdAt; }
}
