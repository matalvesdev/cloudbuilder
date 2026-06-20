package com.cloudbuilder.audit.application.dto;

import java.time.Instant;

public record ComplianceEvaluation(
    String ruleId,
    String ruleName,
    String category,
    String severity,
    boolean passed,
    String message,
    Instant evaluatedAt
) {}
