package com.cloudbuilder.featureflags.application.dto;

/**
 * Request DTO for creating a new feature flag.
 */
public record CreateFlagRequest(
    String flagKey,
    boolean enabled,
    String tenantId,
    String configJson,
    String description
) {}
