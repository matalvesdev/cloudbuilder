package com.cloudbuilder.iam.application.dto;

import com.cloudbuilder.iam.domain.model.Invitation;
import com.cloudbuilder.iam.domain.model.InvitationStatus;
import com.cloudbuilder.iam.domain.model.OrgRole;

import java.time.LocalDateTime;

public record InvitationDTO(
    String id,
    String organizationId,
    String email,
    OrgRole role,
    String token,
    InvitationStatus status,
    String invitedBy,
    LocalDateTime expiresAt,
    LocalDateTime acceptedAt,
    LocalDateTime createdAt
) {
    public static InvitationDTO fromEntity(Invitation invitation) {
        return new InvitationDTO(
            invitation.getId(),
            invitation.getOrganizationId(),
            invitation.getEmail(),
            invitation.getRole(),
            invitation.getToken(),
            invitation.getStatus(),
            invitation.getInvitedBy(),
            invitation.getExpiresAt(),
            invitation.getAcceptedAt(),
            invitation.getCreatedAt()
        );
    }

    public record CreateInvitationRequest(String email, OrgRole role) {}
}
