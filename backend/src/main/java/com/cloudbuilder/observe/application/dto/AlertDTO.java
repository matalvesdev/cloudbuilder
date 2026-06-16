package com.cloudbuilder.observe.application.dto;

import com.cloudbuilder.observe.domain.model.Alert;
import java.time.Instant;

public record AlertDTO(String id, String severity, String message, String source, String status, Instant triggeredAt) {
    public static AlertDTO from(Alert a) {
        return new AlertDTO(a.getId().toString(), a.getSeverity(), a.getMessage(),
                a.getSource(), a.getStatus(), a.getTriggeredAt());
    }
}
