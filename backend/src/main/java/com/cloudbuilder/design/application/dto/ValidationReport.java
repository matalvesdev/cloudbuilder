package com.cloudbuilder.design.application.dto;

import java.time.Instant;
import java.util.List;
public record ValidationReport(
        String canvasId,
        CanvasValidationStatus status,
        List<ValidationIssue> issues,
        Instant validatedAt
) {
    public enum CanvasValidationStatus {
        VALID,
        WARNINGS,
        INVALID,
        PENDING
    }

    public record ValidationIssue(
            String ruleName,
            String severity,
            String message,
            String componentId
    ) {}
}
