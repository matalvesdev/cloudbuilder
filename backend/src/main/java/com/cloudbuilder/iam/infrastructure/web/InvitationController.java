package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.application.dto.InvitationDTO;
import com.cloudbuilder.iam.application.dto.InvitationDTO.CreateInvitationRequest;
import com.cloudbuilder.iam.domain.model.OrgRole;
import com.cloudbuilder.iam.domain.service.InvitationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/invitations")
@PreAuthorize("isAuthenticated()")
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @GetMapping
    public ResponseEntity<List<InvitationDTO>> listInvitations(@PathVariable String organizationId) {
        return ResponseEntity.ok(invitationService.listAllByOrganization(organizationId));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<InvitationDTO>> listPendingInvitations(@PathVariable String organizationId) {
        return ResponseEntity.ok(invitationService.listPendingByOrganization(organizationId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InvitationDTO> createInvitation(
            @PathVariable String organizationId,
            @RequestBody CreateInvitationRequest req,
            Authentication auth) {
        String userId = auth.getName();
        var invitation = invitationService.createInvitation(
            organizationId, req.email(), req.role(), userId
        );
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(InvitationDTO.fromEntity(invitation));
    }

    @PostMapping("/{invitationId}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InvitationDTO> cancelInvitation(
            @PathVariable String organizationId,
            @PathVariable String invitationId) {
        var invitation = invitationService.cancelInvitation(invitationId);
        return ResponseEntity.ok(InvitationDTO.fromEntity(invitation));
    }

    @PostMapping("/accept")
    public ResponseEntity<Map<String, String>> acceptInvitation(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String token = body.get("token");
        String userId = auth.getName();
        invitationService.acceptInvitation(token, userId);
        return ResponseEntity.ok(Map.of("message", "Invitation accepted successfully"));
    }
}
