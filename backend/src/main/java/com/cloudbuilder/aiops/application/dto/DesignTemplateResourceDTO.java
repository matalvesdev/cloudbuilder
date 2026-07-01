package com.cloudbuilder.aiops.application.dto;

public record DesignTemplateResourceDTO(
    String id,
    String label,
    String provider,
    String resourceType,
    String category
) {}
