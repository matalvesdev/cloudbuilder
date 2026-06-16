package com.cloudbuilder.provision.application.dto;

import jakarta.validation.constraints.NotBlank;

public record ImportTerraformRequest(
    @NotBlank String content
) {}
