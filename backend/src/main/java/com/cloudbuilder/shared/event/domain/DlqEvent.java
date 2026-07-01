package com.cloudbuilder.shared.event.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Dead Letter Queue entity for events that failed processing (ADR-035).
 *
 * <p>When a Kafka consumer fails to process an event after max retries,
 * the event is routed to the DLQ topic ({@code *.events.dlq}) and
 * persisted here for manual inspection and replay.
 */
@Entity
@Table(name = "dlq_events")
public class DlqEvent {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "original_topic", nullable = false, length = 100)
    private String originalTopic;

    @Column(name = "original_partition", nullable = false)
    private int originalPartition;

    @Column(name = "original_offset", nullable = false)
    private long originalOffset;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "failed_at", nullable = false)
    private Instant failedAt;

    @Column(name = "tenant_id", length = 36)
    private String tenantId;

    protected DlqEvent() {}

    public DlqEvent(String id, String originalTopic, int originalPartition,
                    long originalOffset, String payload, String failureReason,
                    String tenantId) {
        this.id = id;
        this.originalTopic = originalTopic;
        this.originalPartition = originalPartition;
        this.originalOffset = originalOffset;
        this.payload = payload;
        this.failureReason = failureReason;
        this.tenantId = tenantId;
        this.failedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getOriginalTopic() { return originalTopic; }
    public int getOriginalPartition() { return originalPartition; }
    public long getOriginalOffset() { return originalOffset; }
    public String getPayload() { return payload; }
    public String getFailureReason() { return failureReason; }
    public Instant getFailedAt() { return failedAt; }
    public String getTenantId() { return tenantId; }
}
