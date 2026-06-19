package com.cloudbuilder.provision.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
public record CreateEphemeralRequest(
    @NotBlank String name,
    @NotBlank String repoId,
    @NotBlank String branchName,
    Integer prNumber,
    String prUrl,
    @NotNull String sourceEnvironmentId,
    @Positive int ttlHours,
    @NotBlank String resourceSize
) {}
