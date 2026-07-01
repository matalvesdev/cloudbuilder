package com.cloudbuilder.shared.event.domain;

import com.cloudbuilder.shared.event.PlatformEvent;
import java.time.Instant;

/**
 * Event representing a notification to be dispatched.
 * Published to notification.events topic.
 *
 * <p>Consumed by {@code NotificationEventListenerKafka} which dispatches
 * through configured notification channels (email, webhook, etc.).
 */
public record NotificationEvent(
    String notificationType,
    String title,
    String message,
    String severity,
    String targetUserId,
    String tenantId,
    Instant timestamp
) implements PlatformEvent {
    public NotificationEvent {
        if (timestamp == null) timestamp = Instant.now();
    }

    public NotificationEvent(String notificationType, String title, String message,
                             String severity, String targetUserId, String tenantId) {
        this(notificationType, title, message, severity, targetUserId, tenantId, Instant.now());
    }

    @Override
    public String getEventType() {
        return "notification." + notificationType.toLowerCase();
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
