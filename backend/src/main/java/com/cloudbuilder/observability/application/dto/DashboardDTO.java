package com.cloudbuilder.observability.application.dto;

public record DashboardDTO(
    String id,
    String name,
    String description,
    String definition,
    boolean isDefault
) {}
