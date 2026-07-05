package com.cloudbuilder.iam.application.dto;

import com.cloudbuilder.iam.domain.model.Squad;

import java.time.Instant;

public record SquadDTO(
    String id,
    String workspaceId,
    String tenantId,
    String name,
    String description,
    String leadId,
    Instant createdAt
) {
    public static SquadDTO fromEntity(Squad squad) {
        return new SquadDTO(
            squad.getId(),
            squad.getWorkspaceId(),
            squad.getTenantId(),
            squad.getName(),
            squad.getDescription(),
            squad.getLeadId(),
            squad.getCreatedAt()
        );
    }

    public record CreateSquadRequest(String workspaceId, String name, String description, String leadId) {}
    public record UpdateSquadRequest(String name, String description, String leadId) {}
}
