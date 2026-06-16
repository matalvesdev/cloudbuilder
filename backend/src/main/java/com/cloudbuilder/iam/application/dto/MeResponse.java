package com.cloudbuilder.iam.application.dto;

import java.util.Set;

public record MeResponse(
    String id,
    String name,
    String email,
    Set<String> roles,
    String tenantId,
    String tenantName,
    String tenantSlug
) {}
