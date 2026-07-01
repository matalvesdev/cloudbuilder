package com.cloudbuilder.provision.application.dto;

public record DriftItemDTO(
    String resourceId,
    String resourceName,
    String resourceType,
    String driftType,
    String expectedValue,
    String actualValue,
    String severity
) {}
