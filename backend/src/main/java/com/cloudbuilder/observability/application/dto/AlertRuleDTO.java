package com.cloudbuilder.observability.application.dto;

import java.time.Instant;
public record AlertRuleDTO(
    String id,
    String tenantId,
    String name,
    String description,
    String metricName,
    String condition,
    double threshold,
    int durationSec,
    String severity,
    boolean enabled,
    String notifyChannels,
    Instant createdAt,
    Instant updatedAt
) {}
