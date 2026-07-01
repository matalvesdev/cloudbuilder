package com.cloudbuilder.iam.application.dto;

import com.cloudbuilder.iam.domain.model.Team;

import java.time.LocalDateTime;

public record TeamDTO(
    String id,
    String organizationId,
    String name,
    String description,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static TeamDTO fromEntity(Team team) {
        return new TeamDTO(
            team.getId(),
            team.getOrganizationId(),
            team.getName(),
            team.getDescription(),
            team.getCreatedAt(),
            team.getUpdatedAt()
        );
    }

    public record CreateTeamRequest(String name, String description) {}
    public record UpdateTeamRequest(String name, String description) {}
}
