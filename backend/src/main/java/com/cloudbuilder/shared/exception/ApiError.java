package com.cloudbuilder.shared.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

/**
 * Standard error response body for all API errors.
 * Returned by GlobalExceptionHandler to ensure consistent error format.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
    int status,
    String error,
    String message,
    String path,
    Instant timestamp,
    List<ValidationError> details
) {
    public ApiError(HttpStatus status, String message, String path) {
        this(status.value(), status.getReasonPhrase(), message, path, Instant.now(), null);
    }

    public ApiError(HttpStatus status, String message, String path, List<ValidationError> details) {
        this(status.value(), status.getReasonPhrase(), message, path, Instant.now(), details);
    }

    public record ValidationError(
        String field,
        String message
    ) {}
}
