package com.cloudbuilder.credential.application.dto;

import com.cloudbuilder.credential.domain.model.Credential;
import java.time.Instant;

public record CredentialResponse(
    String id,
    String tenantId,
    String name,
    String provider,
    String authType,
    boolean isActive,
    Instant createdAt,
    Instant updatedAt
) {
    public static CredentialResponse from(Credential c) {
        return new CredentialResponse(
            c.getId(), c.getTenantId(), c.getName(), c.getProvider(),
            c.getAuthType(), c.isActive(), c.getCreatedAt(), c.getUpdatedAt());
    }
}
