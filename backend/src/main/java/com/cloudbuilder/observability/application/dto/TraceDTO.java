package com.cloudbuilder.observability.application.dto;

import java.util.List;

public record TraceDTO(
    String traceId,
    String serviceName,
    String operation,
    long startTime,
    int durationMs,
    int statusCode,
    boolean isError,
    List<SpanDTO> spans
) {}
