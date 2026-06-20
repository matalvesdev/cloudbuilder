package com.cloudbuilder.cost.application.dto;

import java.time.LocalDate;

public record CostAnomaly(
        String id,
        String serviceName,
        LocalDate date,
        double actualAmount,
        double expectedAmount,
        double deviationPct,
        String severity
) {
    public CostAnomaly {
        if (severity == null || severity.isBlank()) {
            severity = "LOW";
        }
        if (id == null || id.isBlank()) {
            id = java.util.UUID.randomUUID().toString();
        }
    }
}
