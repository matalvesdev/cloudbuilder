package com.cloudbuilder.apm.application.dto;

import java.util.List;

public record APMSnapshotDTO(
    List<TraceDTO> recentTraces,
    List<AlertDTO> activeAlerts,
    long timestamp
) {}
