package com.cloudbuilder.observability.application.dto;

import java.time.Instant;
import java.util.Map;

public record MetricQueryResult(
    Instant timestamp,
    double value,
    Map<String, String> tags
) {}
