package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.application.dto.InvitationDTO;
import com.cloudbuilder.iam.domain.model.Invitation;
import com.cloudbuilder.iam.domain.model.InvitationStatus;
import com.cloudbuilder.iam.domain.model.OrgRole;
import com.cloudbuilder.iam.domain.port.InvitationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final MembershipService membershipService;
    private final EmailService emailService;

    public InvitationService(InvitationRepository invitationRepository,
                             MembershipService membershipService,
                             EmailService emailService) {
        this.invitationRepository = invitationRepository;
        this.membershipService = membershipService;
        this.emailService = emailService;
    }

    public Invitation createInvitation(String organizationId, String email, OrgRole role, String invitedBy) {
        // Check for existing pending invitation
        var existing = invitationRepository.findByEmailAndOrganizationIdAndStatus(email, organizationId, InvitationStatus.PENDING);
        if (existing.isPresent()) {
            throw new IllegalStateException("A pending invitation already exists for this email in this organization");
        }

        Invitation invitation = new Invitation(
            organizationId,
            email,
            role,
            invitedBy,
            LocalDateTime.now().plusDays(7) // 7 days expiry
        );

        Invitation saved = invitationRepository.save(invitation);

        // Send invitation email (stub)
        emailService.sendInvitationEmail(email, invitation.getToken(), organizationId);

        return saved;
    }

    public Invitation acceptInvitation(String token, String userId) {
        Invitation invitation = invitationRepository.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("Invitation is not in PENDING status");
        }

        if (invitation.isExpired()) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new IllegalStateException("Invitation has expired");
        }

        // Create membership
        membershipService.inviteMember(invitation.getOrganizationId(), userId, invitation.getRole());

        // Mark invitation as accepted
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        return invitationRepository.save(invitation);
    }

    public Invitation cancelInvitation(String invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
            .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("Only pending invitations can be cancelled");
        }

        invitation.setStatus(InvitationStatus.CANCELLED);
        return invitationRepository.save(invitation);
    }

    public List<InvitationDTO> listPendingByOrganization(String organizationId) {
        return invitationRepository.findByOrganizationIdAndStatus(organizationId, InvitationStatus.PENDING)
            .stream()
            .map(InvitationDTO::fromEntity)
            .toList();
    }

    public List<InvitationDTO> listAllByOrganization(String organizationId) {
        return invitationRepository.findByOrganizationId(organizationId)
            .stream()
            .map(InvitationDTO::fromEntity)
            .toList();
    }
}
