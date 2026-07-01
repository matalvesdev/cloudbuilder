package com.cloudbuilder.featureflags.application.dto;

/**
 * Request DTO for updating an existing feature flag.
 */
public record UpdateFlagRequest(
    Boolean enabled,
    String configJson,
    String description
) {}
