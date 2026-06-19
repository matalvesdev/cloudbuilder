package com.cloudbuilder.observability.application.dto;

import java.time.Instant;
import java.util.List;

public record MetricQueryRequest(
    String metricName,
    String tenantId,
    Instant startTime,
    Instant endTime,
    String aggregation,
    List<String> groupByTags
) {}
