package com.cloudbuilder.aiops.application.dto;

import com.cloudbuilder.aiops.domain.model.Incident;

import java.time.Instant;

public record IncidentDTO(
    String id,
    String environmentId,
    String title,
    String description,
    String severity,
    String status,
    String classification,
    String suggestedRca,
    Instant detectedAt,
    Instant resolvedAt
) {
    public static IncidentDTO from(Incident incident) {
        return new IncidentDTO(
            incident.getId().toString(),
            incident.getEnvironmentId(),
            incident.getTitle(),
            incident.getDescription(),
            incident.getSeverity(),
            incident.getStatus(),
            incident.getClassification(),
            incident.getSuggestedRca(),
            incident.getDetectedAt(),
            incident.getResolvedAt()
        );
    }
}
