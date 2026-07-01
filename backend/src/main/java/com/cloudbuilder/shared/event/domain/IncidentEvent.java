package com.cloudbuilder.shared.event.domain;

import com.cloudbuilder.shared.event.PlatformEvent;
import java.time.Instant;

public record IncidentEvent(
    String incidentId,
    String severity,
    String status,
    String source,
    String title,
    String tenantId,
    Instant timestamp
) implements PlatformEvent {
    public IncidentEvent {
        if (timestamp == null) timestamp = Instant.now();
    }

    public IncidentEvent(String incidentId, String severity, String status, String source, String title, String tenantId) {
        this(incidentId, severity, status, source, title, tenantId, Instant.now());
    }

    @Override
    public String getEventType() {
        return "incident." + status.toLowerCase();
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
