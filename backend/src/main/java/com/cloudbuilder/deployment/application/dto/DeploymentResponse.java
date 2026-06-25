package com.cloudbuilder.deployment.application.dto;

import com.cloudbuilder.deployment.domain.model.Deployment;
import com.cloudbuilder.deployment.domain.model.Deployment.Status;
import java.time.Instant;

public record DeploymentResponse(
    String id,
    String tenantId,
    String environmentId,
    String canvasDesignId,
    String version,
    Status status,
    String deployedBy,
    String executionLog,
    Instant startedAt,
    Instant completedAt,
    Instant createdAt
) {
    public static DeploymentResponse from(Deployment d) {
        return new DeploymentResponse(
            d.getId(), d.getTenantId(), d.getEnvironmentId(),
            d.getCanvasDesignId(), d.getVersion(), d.getStatus(),
            d.getDeployedBy(), d.getExecutionLog(), d.getStartedAt(),
            d.getCompletedAt(), d.getCreatedAt());
    }
}
