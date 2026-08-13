package com.cloudbuilder.design.domain.event;

import com.cloudbuilder.shared.event.PlatformEvent;

import java.time.Instant;

public record CanvasContentReplacedEvent(
        String canvasId,
        String tenantId,
        int designVersion,
        int nodeCount,
        int edgeCount,
        Instant timestamp
) implements PlatformEvent {

    @Override
    public String getEventType() {
        return "canvas.content-replaced";
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
