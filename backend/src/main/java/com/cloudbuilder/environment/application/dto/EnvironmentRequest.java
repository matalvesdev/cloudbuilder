package com.cloudbuilder.environment.application.dto;

import jakarta.validation.constraints.NotBlank;

public record EnvironmentRequest(
    @NotBlank String tenantId,
    @NotBlank String name,
    String description,
    @NotBlank String provider,
    @NotBlank String region,
    @NotBlank String credentialsId,
    String configJson
) {}
