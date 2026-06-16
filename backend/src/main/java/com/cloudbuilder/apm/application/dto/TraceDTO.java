package com.cloudbuilder.apm.application.dto;

import java.util.List;

public record TraceDTO(
    String traceId,
    String serviceName,
    String operation,
    long startTime,
    long durationMs,
    int statusCode,
    boolean isError,
    List<SpanDTO> spans
) {}
