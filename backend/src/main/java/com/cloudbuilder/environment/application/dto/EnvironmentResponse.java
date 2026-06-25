package com.cloudbuilder.environment.application.dto;

import com.cloudbuilder.environment.domain.model.ManagedEnvironment;
import com.cloudbuilder.environment.domain.model.ManagedEnvironment.Status;
import java.time.Instant;

public record EnvironmentResponse(
    String id,
    String tenantId,
    String name,
    String description,
    String provider,
    String region,
    String credentialsId,
    String configJson,
    Status status,
    Instant createdAt,
    Instant updatedAt
) {
    public static EnvironmentResponse from(ManagedEnvironment env) {
        return new EnvironmentResponse(
            env.getId(), env.getTenantId(), env.getName(), env.getDescription(),
            env.getProvider(), env.getRegion(), env.getCredentialsId(),
            env.getConfigJson(), env.getStatus(), env.getCreatedAt(), env.getUpdatedAt());
    }
}
