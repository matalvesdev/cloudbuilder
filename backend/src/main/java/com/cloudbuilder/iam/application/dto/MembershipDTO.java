package com.cloudbuilder.iam.application.dto;

import com.cloudbuilder.iam.domain.model.Membership;
import com.cloudbuilder.iam.domain.model.OrgRole;

import java.time.LocalDateTime;

public record MembershipDTO(
    String id,
    String organizationId,
    String teamId,
    String userId,
    OrgRole role,
    Membership.Status status,
    LocalDateTime invitedAt,
    LocalDateTime joinedAt
) {
    public static MembershipDTO fromEntity(Membership membership) {
        return new MembershipDTO(
            membership.getId(),
            membership.getOrganizationId(),
            membership.getTeamId(),
            membership.getUserId(),
            membership.getRole(),
            membership.getStatus(),
            membership.getInvitedAt(),
            membership.getJoinedAt()
        );
    }

    public record InviteMemberRequest(String userId, OrgRole role) {}
    public record UpdateRoleRequest(OrgRole role) {}
    public record AssignToTeamRequest(String teamId) {}
}
