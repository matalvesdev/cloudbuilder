package com.cloudbuilder.credential.application.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateCredentialRequest(
    @NotBlank String name,
    @NotBlank String provider,
    @NotBlank String authType,
    @NotBlank String encryptedPayload,
    boolean isActive
) {}
