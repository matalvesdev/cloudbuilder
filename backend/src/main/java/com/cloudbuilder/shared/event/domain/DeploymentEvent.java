package com.cloudbuilder.shared.event.domain;

import com.cloudbuilder.shared.event.PlatformEvent;
import java.time.Instant;

/**
 * Deployment lifecycle event published to deployment.events topic.
 *
 * <p>Status values map to the DeploymentStateMachine states:
 * requested, validating, waiting_approval, provisioning, deploying, completed, failed
 */
public record DeploymentEvent(
    String deploymentId,
    String environmentId,
    String status,
    String message,
    String tenantId,
    Instant timestamp
) implements PlatformEvent {
    public DeploymentEvent {
        if (timestamp == null) timestamp = Instant.now();
    }

    public DeploymentEvent(String deploymentId, String environmentId, String status, String tenantId) {
        this(deploymentId, environmentId, status, null, tenantId, Instant.now());
    }

    @Override
    public String getEventType() {
        return "deployment." + status.toLowerCase();
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
