package com.cloudbuilder.iam.application.dto;

import com.cloudbuilder.iam.domain.model.Workspace;
import java.time.LocalDateTime;

public record WorkspaceDTO(
    String id,
    String organizationId,
    String name,
    String description,
    String settings,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static WorkspaceDTO fromEntity(Workspace workspace) {
        return new WorkspaceDTO(
            workspace.getId(),
            workspace.getOrganizationId(),
            workspace.getName(),
            workspace.getDescription(),
            workspace.getSettings(),
            workspace.isActive(),
            workspace.getCreatedAt(),
            workspace.getUpdatedAt()
        );
    }

    public record CreateWorkspaceRequest(String name, String description) {}
    public record UpdateWorkspaceRequest(String name, String description, String settings) {}
}
