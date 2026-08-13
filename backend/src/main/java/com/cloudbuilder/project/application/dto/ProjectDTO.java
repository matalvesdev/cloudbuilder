package com.cloudbuilder.project.application.dto;

import com.cloudbuilder.project.domain.model.Project;
import java.time.Instant;

public record ProjectDTO(
    String id,
    String tenantId,
    String name,
    String description,
    String slug,
    Project.ProjectStatus status,
    String defaultBranch,
    Instant createdAt
) {
    public static ProjectDTO from(Project p) {
        return new ProjectDTO(
            p.getId(), p.getTenantId(), p.getName(), p.getDescription(),
            p.getSlug(), p.getStatus(), p.getDefaultBranch(), p.getCreatedAt()
        );
    }
}
