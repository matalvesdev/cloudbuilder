package com.cloudbuilder.shared.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Base interface for all platform-wide events in CloudBuilder.
 * Every event carries a tenantId, a timestamp, and a typed event name.
 *
 * <p>Extended with Kafka-compatible fields (ADR-035):
 * <ul>
 *   <li>{@code eventId} — unique event identifier for idempotency (Inbox Pattern)</li>
 *   <li>{@code correlationId} — groups related events across a business flow</li>
 *   <li>{@code causationId} — points to the event that caused this one</li>
 *   <li>{@code version} — schema version for forward/backward compatibility</li>
 * </ul>
 */
public interface PlatformEvent {
    String getEventType();
    String getTenantId();
    Instant getTimestamp();

    /**
     * Unique event identifier for deduplication (Inbox Pattern).
     * Default generates a random UUID v4; records can override if needed.
     */
    default String getEventId() {
        return UUID.randomUUID().toString();
    }

    /**
     * Correlation ID groups related events across a business flow.
     * Example: a canvas→provision→deploy flow shares one correlationId.
     * Returns null if not part of a correlated flow.
     */
    default String getCorrelationId() {
        return null;
    }

    /**
     * Points to the eventId of the event that directly caused this one.
     * Returns null if this is a root-level event (not triggered by another).
     */
    default String getCausationId() {
        return null;
    }

    /**
     * Schema version for forward/backward compatibility.
     * Starts at 1; increment when the event's payload structure changes.
     */
    default int getVersion() {
        return 1;
    }
}
