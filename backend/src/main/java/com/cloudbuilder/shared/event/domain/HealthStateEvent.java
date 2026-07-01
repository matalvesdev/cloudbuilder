package com.cloudbuilder.shared.event.domain;

import com.cloudbuilder.shared.event.PlatformEvent;
import java.time.Instant;

public record HealthStateEvent(
    String environmentId,
    String serviceId,
    String serviceName,
    String previousState,
    String newState,
    String tenantId,
    Instant timestamp
) implements PlatformEvent {
    public HealthStateEvent {
        if (timestamp == null) timestamp = Instant.now();
    }

    public HealthStateEvent(String environmentId, String serviceId, String serviceName,
                            String previousState, String newState, String tenantId) {
        this(environmentId, serviceId, serviceName, previousState, newState, tenantId, Instant.now());
    }

    @Override
    public String getEventType() {
        return "health." + newState.toLowerCase();
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
