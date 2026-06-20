package com.cloudbuilder.cost.application.dto;

import java.time.LocalDate;

public record CostProjectionPoint(
        LocalDate date,
        double projectedAmount,
        double lowerBound,
        double upperBound
) {
}
