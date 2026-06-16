package com.cloudbuilder.metrics.application.dto;

import java.util.List;

public record ResourceMetricsDTO(
    String nodeId,
    String resourceName,
    String resourceType,
    String provider,
    List<MetricPointDTO> cpuUtilization,
    List<MetricPointDTO> memoryUtilization,
    List<MetricPointDTO> networkIn,
    List<MetricPointDTO> networkOut,
    List<MetricPointDTO> diskReadOps,
    List<MetricPointDTO> diskWriteOps,
    String status,
    long lastUpdated
) {}
