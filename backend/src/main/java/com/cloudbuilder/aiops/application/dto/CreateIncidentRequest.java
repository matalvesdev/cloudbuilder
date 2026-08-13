package com.cloudbuilder.aiops.application.dto;

public record CreateIncidentRequest(
    String environmentId,
    String title,
    String description,
    String severity
) {}
