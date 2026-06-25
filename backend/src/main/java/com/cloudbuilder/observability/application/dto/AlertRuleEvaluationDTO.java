package com.cloudbuilder.observability.application.dto;

import java.time.Instant;

public record AlertRuleEvaluationDTO(
    String id,
    String alertRuleId,
    Instant evaluatedAt,
    Double currentValue,
    Double threshold,
    boolean breached
) {}
