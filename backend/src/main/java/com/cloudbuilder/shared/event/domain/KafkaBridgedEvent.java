package com.cloudbuilder.shared.event.domain;

import com.cloudbuilder.shared.event.PlatformEvent;

import java.time.Instant;

/**
 * Marker event for messages imported from Kafka into the local Spring event
 * bus. The marker prevents those messages from being written to the outbox
 * and published back to Kafka.
 */
public record KafkaBridgedEvent(
        String eventId,
        String eventType,
        String tenantId,
        Instant timestamp
) implements PlatformEvent {

    @Override
    public String getEventId() {
        return eventId;
    }

    @Override
    public String getEventType() {
        return eventType;
    }

    @Override
    public String getTenantId() {
        return tenantId;
    }

    @Override
    public Instant getTimestamp() {
        return timestamp;
    }
}
