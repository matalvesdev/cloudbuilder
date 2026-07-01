package com.cloudbuilder.iam.application.dto;

import com.cloudbuilder.iam.domain.model.Organization;

import java.time.LocalDateTime;

public record OrganizationDTO(
    String id,
    String name,
    String slug,
    String ownerId,
    String settings,
    boolean active,
    long memberCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static OrganizationDTO fromEntity(Organization org, long memberCount) {
        return new OrganizationDTO(
            org.getId(),
            org.getName(),
            org.getSlug(),
            org.getOwnerId(),
            org.getSettings(),
            org.isActive(),
            memberCount,
            org.getCreatedAt(),
            org.getUpdatedAt()
        );
    }

    public record CreateOrganizationRequest(String name, String slug) {}
    public record UpdateOrganizationRequest(String name, String settings) {}
}
