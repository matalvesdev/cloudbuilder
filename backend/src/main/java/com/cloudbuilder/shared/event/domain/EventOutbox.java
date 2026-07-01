package com.cloudbuilder.shared.event.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Transactional outbox entity for reliable event publishing.
 * Events are persisted in the same transaction as the business operation,
 * then asynchronously processed by OutboxSweeper or the OutboxEventListener.
 */
@Entity
@Table(name = "event_outbox")
public class EventOutbox {

    public enum Status {
        PENDING,
        PUBLISHED,
        FAILED
    }

    @Id
    private String id;

    @Column(nullable = false, length = 100)
    private String eventType;

    @Column(nullable = false)
    private String eventClass;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(length = 36)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant processedAt;

    @Column(nullable = false)
    private int retryCount;

    @Column(columnDefinition = "TEXT")
    private String lastError;

    protected EventOutbox() {}

    public EventOutbox(String eventType, String eventClass, String payload, String tenantId) {
        this.id = UUID.randomUUID().toString();
        this.eventType = eventType;
        this.eventClass = eventClass;
        this.payload = payload;
        this.tenantId = tenantId;
        this.status = Status.PENDING;
        this.createdAt = Instant.now();
        this.retryCount = 0;
    }

    public void markPublished() {
        this.status = Status.PUBLISHED;
        this.processedAt = Instant.now();
        this.lastError = null;
    }

    public void markFailed(String error) {
        this.status = Status.FAILED;
        this.retryCount++;
        this.lastError = error != null && error.length() > 2000
            ? error.substring(0, 2000)
            : error;
    }

    public void retry() {
        this.status = Status.PENDING;
        this.lastError = null;
    }

    // Getters
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
}
