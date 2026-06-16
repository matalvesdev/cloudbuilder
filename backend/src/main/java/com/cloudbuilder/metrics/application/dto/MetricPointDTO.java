package com.cloudbuilder.metrics.application.dto;

public record MetricPointDTO(
    long timestamp,
    double value
) {}
