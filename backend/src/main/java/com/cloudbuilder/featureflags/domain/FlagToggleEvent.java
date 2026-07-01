package com.cloudbuilder.featureflags.domain;

import com.cloudbuilder.shared.event.PlatformEvent;
import java.time.Instant;

/**
 * Event published when a feature flag is toggled.
 * Consumed by AuditService for audit trail.
 */
public class FlagToggleEvent implements PlatformEvent {

    private final String eventType = "FLAG_TOGGLED";
    private final String flagKey;
    private final boolean newValue;
    private final String changedBy;
    private final String tenantId;
    private final Instant timestamp;

    public FlagToggleEvent(String flagKey, boolean newValue, String changedBy, String tenantId) {
        this.flagKey = flagKey;
        this.newValue = newValue;
        this.changedBy = changedBy;
        this.tenantId = tenantId;
        this.timestamp = Instant.now();
    }

    @Override
    public String getEventType() { return eventType; }

    @Override
    public String getTenantId() { return tenantId; }

    @Override
    public Instant getTimestamp() { return timestamp; }

    public String getFlagKey() { return flagKey; }
    public boolean isNewValue() { return newValue; }
    public String getChangedBy() { return changedBy; }
}
