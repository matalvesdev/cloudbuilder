package com.cloudbuilder.iam.application.dto;

import java.util.Set;

public record AuthResponse(
    String token,
    String refreshToken,
    long expiresIn,
    String userId,
    String name,
    String email,
    Set<String> roles,
    String tenantId,
    String tenantName,
    String tenantSlug
) {}
