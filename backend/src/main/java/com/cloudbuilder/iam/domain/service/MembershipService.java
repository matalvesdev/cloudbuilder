package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.Membership;
import com.cloudbuilder.iam.domain.model.OrgRole;
import com.cloudbuilder.iam.domain.port.MembershipRepository;
import com.cloudbuilder.iam.domain.port.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final OrganizationRepository organizationRepository;

    public MembershipService(MembershipRepository membershipRepository,
                             OrganizationRepository organizationRepository) {
        this.membershipRepository = membershipRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional(readOnly = true)
    public Membership getMembership(String id) {
        return membershipRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Membresia não encontrada: " + id));
    }

    @Transactional(readOnly = true)
    public Membership getMembershipByOrgAndUser(String organizationId, String userId) {
        return membershipRepository.findByOrganizationIdAndUserId(organizationId, userId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Membresia não encontrada para organização " + organizationId + " e usuário " + userId));
    }

    public Membership inviteMember(String organizationId, String userId, OrgRole role) {
        // Verify org exists
        organizationRepository.findById(organizationId)
            .orElseThrow(() -> new IllegalArgumentException("Organização não encontrada: " + organizationId));

        if (membershipRepository.existsByOrganizationIdAndUserId(organizationId, userId)) {
            throw new IllegalArgumentException("Usuário já é membro desta organização");
        }

        var membership = new Membership(organizationId, userId, role);
        membership.setStatus(Membership.Status.INVITED);
        membership.setJoinedAt(null);
        return membershipRepository.save(membership);
    }

    public Membership acceptInvitation(String membershipId) {
        var membership = getMembership(membershipId);
        if (membership.getStatus() != Membership.Status.INVITED) {
            throw new IllegalArgumentException("Esta não é uma convite pendente");
        }
        membership.setStatus(Membership.Status.ACTIVE);
        membership.setJoinedAt(java.time.LocalDateTime.now());
        return membershipRepository.save(membership);
    }

    public Membership updateRole(String membershipId, OrgRole newRole) {
        var membership = getMembership(membershipId);
        membership.setRole(newRole);
        return membershipRepository.save(membership);
    }

    public Membership assignToTeam(String membershipId, String teamId) {
        var membership = getMembership(membershipId);
        membership.setTeamId(teamId);
        return membershipRepository.save(membership);
    }

    public Membership removeFromTeam(String membershipId) {
        var membership = getMembership(membershipId);
        membership.setTeamId(null);
        return membershipRepository.save(membership);
    }

    public void removeMember(String membershipId) {
        var membership = getMembership(membershipId);
        membershipRepository.delete(membership);
    }

    public void disableMember(String membershipId) {
        var membership = getMembership(membershipId);
        membership.setStatus(Membership.Status.DISABLED);
        membershipRepository.save(membership);
    }

    @Transactional(readOnly = true)
    public List<Membership> listMembersByOrganization(String organizationId) {
        return membershipRepository.findByOrganizationId(organizationId);
    }

    @Transactional(readOnly = true)
    public List<Membership> listOrganizationsByUser(String userId) {
        return membershipRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Membership> listMembersByTeam(String teamId) {
        return membershipRepository.findByTeamId(teamId);
    }

    @Transactional(readOnly = true)
    public boolean isMember(String organizationId, String userId) {
        return membershipRepository.existsByOrganizationIdAndUserId(organizationId, userId);
    }

    @Transactional(readOnly = true)
    public boolean hasRole(String organizationId, String userId, OrgRole requiredRole) {
        return membershipRepository.findByOrganizationIdAndUserId(organizationId, userId)
            .map(m -> m.getRole().ordinal() <= requiredRole.ordinal())
            .orElse(false);
    }
}
