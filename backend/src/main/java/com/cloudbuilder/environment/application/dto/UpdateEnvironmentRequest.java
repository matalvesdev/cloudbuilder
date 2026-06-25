package com.cloudbuilder.environment.application.dto;

import com.cloudbuilder.environment.domain.model.ManagedEnvironment.Status;
import jakarta.validation.constraints.NotBlank;

public record UpdateEnvironmentRequest(
    @NotBlank String name,
    String description,
    @NotBlank String provider,
    @NotBlank String region,
    @NotBlank String credentialsId,
    String configJson,
    Status status
) {}
