package com.cloudbuilder.deployment.application.dto;

import jakarta.validation.constraints.NotBlank;

public record DeploymentRequest(
    @NotBlank String tenantId,
    @NotBlank String environmentId,
    @NotBlank String canvasDesignId,
    @NotBlank String version,
    @NotBlank String deployedBy
) {}
