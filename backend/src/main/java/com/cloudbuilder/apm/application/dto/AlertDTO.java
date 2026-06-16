package com.cloudbuilder.apm.application.dto;

public record AlertDTO(
    String id,
    String severity,       // "critical" | "warning" | "info"
    String title,
    String message,
    String resourceName,
    String resourceType,
    long timestamp,
    boolean acknowledged
) {}
