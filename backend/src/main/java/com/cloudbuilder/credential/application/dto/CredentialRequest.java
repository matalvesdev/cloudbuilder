package com.cloudbuilder.credential.application.dto;

import jakarta.validation.constraints.NotBlank;

public record CredentialRequest(
    @NotBlank String tenantId,
    @NotBlank String name,
    @NotBlank String provider,
    @NotBlank String authType,
    @NotBlank String encryptedPayload
) {}
