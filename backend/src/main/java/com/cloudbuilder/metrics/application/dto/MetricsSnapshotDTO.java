package com.cloudbuilder.metrics.application.dto;

import java.util.List;

public record MetricsSnapshotDTO(
    long timestamp,
    List<ResourceMetricsDTO> resources
) {}
