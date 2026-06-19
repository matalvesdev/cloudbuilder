package com.cloudbuilder.observability.application.dto;

import java.time.Instant;
public record IncidentDTO(
    String id,
    String alertRuleId,
    String tenantId,
    String title,
    String description,
    String severity,
    String status,
    Double currentValue,
    Double threshold,
    Instant startedAt,
    Instant acknowledgedAt,
    Instant resolvedAt
) {}
