package com.cloudbuilder.shared.event.domain;

import com.cloudbuilder.shared.event.PlatformEvent;
import java.time.Instant;

/**
 * Event representing an action that should be recorded in the audit trail.
 * Published to audit.events topic for compliance and traceability.
 *
 * <p>Consumed by {@code AuditEventListenerKafka} which persists to audit_events table.
 */
public record AuditTrailEvent(
    String action,
    String resourceType,
    String resourceId,
    String userId,
    String details,
    String ipAddress,
    String tenantId,
    Instant timestamp
) implements PlatformEvent {
    public AuditTrailEvent {
        if (timestamp == null) timestamp = Instant.now();
    }

    public AuditTrailEvent(String action, String resourceType, String resourceId,
                           String userId, String details, String tenantId) {
        this(action, resourceType, resourceId, userId, details, null, tenantId, Instant.now());
    }

    @Override
    public String getEventType() {
        return "audit." + action.toLowerCase();
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
