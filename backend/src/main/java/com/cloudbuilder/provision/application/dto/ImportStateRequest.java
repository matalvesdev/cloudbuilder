package com.cloudbuilder.provision.application.dto;

import jakarta.validation.constraints.NotBlank;

public record ImportStateRequest(
    @NotBlank String content   // JSON do terraform.tfstate
) {}
