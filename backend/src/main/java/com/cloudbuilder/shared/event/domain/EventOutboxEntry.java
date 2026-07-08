package com.cloudbuilder.shared.event.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Transactional Outbox entry (ADR-035).
 * Guarantees at-least-once event delivery by persisting events in the same
 * transaction as the business operation, then asynchronously publishing via OutboxSweeper.
 */
@Entity
@Table(name = "event_outbox", indexes = {
    @Index(name = "idx_event_outbox_status", columnList = "status, created_at"),
    @Index(name = "idx_event_outbox_tenant", columnList = "tenant_id"),
    @Index(name = "idx_event_outbox_processed", columnList = "status, processed_at")
})
public class EventOutboxEntry {

    public enum Status {
        PENDING, PROCESSING, PROCESSED, FAILED
    }

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "event_class", nullable = false, length = 255)
    private String eventClass;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "tenant_id", length = 36)
    private String tenantId;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    protected EventOutboxEntry() {}

    public EventOutboxEntry(String eventType, String eventClass, String payload, String tenantId) {
        this.id = UUID.randomUUID().toString();
        this.eventType = eventType;
        this.eventClass = eventClass;
        this.payload = payload;
        this.tenantId = tenantId;
        this.status = Status.PENDING;
        this.createdAt = Instant.now();
        this.retryCount = 0;
    }

    public String getId() { return id; }
    public String getEventType() { return eventType; }
    public String getEventClass() { return eventClass; }
    public String getPayload() { return payload; }
    public String getTenantId() { return tenantId; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getProcessedAt() { return processedAt; }
    public int getRetryCount() { return retryCount; }
    public String getLastError() { return lastError; }

    public void setStatus(Status status) { this.status = status; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
    public void setLastError(String lastError) { this.lastError = lastError; }

    public void markProcessing() {
        this.status = Status.PROCESSING;
    }

    public void markProcessed() {
        this.status = Status.PROCESSED;
        this.processedAt = Instant.now();
    }

    public void markFailed(String error) {
        this.status = Status.FAILED;
        this.retryCount++;
        this.lastError = error;
    }
}
