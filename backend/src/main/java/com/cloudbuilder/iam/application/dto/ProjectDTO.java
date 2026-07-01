package com.cloudbuilder.iam.application.dto;

import com.cloudbuilder.iam.domain.model.Project;

import java.time.LocalDateTime;

public record ProjectDTO(
    String id,
    String organizationId,
    String name,
    String description,
    String settings,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static ProjectDTO fromEntity(Project project) {
        return new ProjectDTO(
            project.getId(),
            project.getOrganizationId(),
            project.getName(),
            project.getDescription(),
            project.getSettings(),
            project.isActive(),
            project.getCreatedAt(),
            project.getUpdatedAt()
        );
    }

    public record CreateProjectRequest(String name, String description) {}
    public record UpdateProjectRequest(String name, String description, String settings) {}
}
