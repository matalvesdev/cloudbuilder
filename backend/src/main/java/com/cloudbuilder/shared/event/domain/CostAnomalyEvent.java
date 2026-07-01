package com.cloudbuilder.shared.event.domain;

import com.cloudbuilder.shared.event.PlatformEvent;
import java.time.Instant;

public record CostAnomalyEvent(
    String environmentId,
    String budgetId,
    double currentSpend,
    double threshold,
    String tenantId,
    Instant timestamp
) implements PlatformEvent {
    public CostAnomalyEvent {
        if (timestamp == null) timestamp = Instant.now();
    }

    public CostAnomalyEvent(String environmentId, String budgetId, double currentSpend, double threshold, String tenantId) {
        this(environmentId, budgetId, currentSpend, threshold, tenantId, Instant.now());
    }

    public String getEventType() {
        return "cost.anomaly";
    }

    public String getTenantId() {
        return tenantId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }
}
