package com.cloudbuilder.shared.event.domain;

import com.cloudbuilder.shared.event.PlatformEvent;
import java.time.Instant;

public record DriftDetectedEvent(
    String environmentId,
    String reportId,
    int driftCount,
    boolean hasDrift,
    String tenantId,
    Instant timestamp
) implements PlatformEvent {
    public DriftDetectedEvent {
        if (timestamp == null) timestamp = Instant.now();
    }

    public DriftDetectedEvent(String environmentId, String reportId, int driftCount, boolean hasDrift, String tenantId) {
        this(environmentId, reportId, driftCount, hasDrift, tenantId, Instant.now());
    }

    @Override
    public String getEventType() {
        return "drift." + (hasDrift ? "detected" : "resolved");
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
