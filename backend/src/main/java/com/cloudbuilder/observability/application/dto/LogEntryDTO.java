package com.cloudbuilder.observability.application.dto;

import java.time.Instant;

public record LogEntryDTO(
    String tenantId,
    Instant timestamp,
    String level,
    String loggerName,
    String threadName,
    String message,
    String traceId,
    String spanId,
    String stackTrace,
    String structured
) {}
