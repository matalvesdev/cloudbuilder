package com.cloudbuilder.shared.api;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Arrays;
import java.util.Map;

/**
 * Controller advice that handles unsupported API version requests.
 * Returns 406 Not Acceptable with the list of supported versions.
 */
@ControllerAdvice
public class ApiVersionControllerAdvice {

    @ExceptionHandler(UnsupportedApiVersionException.class)
    public ResponseEntity<Map<String, Object>> handleUnsupportedVersion(
            UnsupportedApiVersionException ex, HttpServletRequest request) {
        return ResponseEntity
            .status(HttpStatus.NOT_ACCEPTABLE)
            .body(Map.of(
                "error", "Versão de API não suportada",
                "message", ex.getMessage(),
                "supportedVersions", Arrays.stream(ApiVersion.values())
                    .map(ApiVersion::getMediaType)
                    .toList(),
                "requested", ex.getRequestedVersion()
            ));
    }
}
