package com.cloudbuilder.apm.application.dto;

public record SpanDTO(
    String spanId,
    String operation,
    String serviceName,
    long startTime,
    long durationMs,
    int statusCode,
    String status
) {}
