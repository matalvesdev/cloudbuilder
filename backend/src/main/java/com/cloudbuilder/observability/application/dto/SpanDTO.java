package com.cloudbuilder.observability.application.dto;

public record SpanDTO(
    String spanId,
    String operation,
    String serviceName,
    long startTime,
    int durationMs,
    int statusCode,
    String status
) {}
