package com.cloudbuilder.shared.event.domain;

import com.cloudbuilder.shared.event.PlatformEvent;
import java.time.Instant;

/**
 * Event representing a canvas design change.
 * Published to canvas.events topic for audit trail and real-time sync.
 *
 * <p>Event types: canvas.created, canvas.updated, canvas.deleted,
 * canvas.node.added, canvas.node.removed, canvas.edge.added, canvas.edge.removed
 */
public record CanvasEvent(
    String canvasAction,
    String canvasId,
    String nodeId,
    String edgeId,
    String userId,
    String tenantId,
    Instant timestamp
) implements PlatformEvent {
    public CanvasEvent {
        if (timestamp == null) timestamp = Instant.now();
    }

    public CanvasEvent(String canvasAction, String canvasId, String userId, String tenantId) {
        this(canvasAction, canvasId, null, null, userId, tenantId, Instant.now());
    }

    @Override
    public String getEventType() {
        return "canvas." + canvasAction.toLowerCase();
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
