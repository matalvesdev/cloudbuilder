package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.application.dto.MembershipDTO;
import com.cloudbuilder.iam.application.dto.MembershipDTO.InviteMemberRequest;
import com.cloudbuilder.iam.application.dto.MembershipDTO.UpdateRoleRequest;
import com.cloudbuilder.iam.application.dto.MembershipDTO.AssignToTeamRequest;
import com.cloudbuilder.iam.domain.model.OrgRole;
import com.cloudbuilder.iam.domain.service.MembershipService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/members")
@PreAuthorize("isAuthenticated()")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping
    public ResponseEntity<List<MembershipDTO>> listMembers(@PathVariable String organizationId) {
        var members = membershipService.listMembersByOrganization(organizationId);
        return ResponseEntity.ok(members.stream().map(MembershipDTO::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MembershipDTO> getMembership(@PathVariable String id) {
        return ResponseEntity.ok(MembershipDTO.fromEntity(membershipService.getMembership(id)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<MembershipDTO> getMembershipByUser(
            @PathVariable String organizationId,
            @PathVariable String userId) {
        return ResponseEntity.ok(
            MembershipDTO.fromEntity(membershipService.getMembershipByOrgAndUser(organizationId, userId)));
    }

    @PostMapping("/invite")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<MembershipDTO> inviteMember(
            @PathVariable String organizationId,
            @RequestBody InviteMemberRequest req) {
        var membership = membershipService.inviteMember(organizationId, req.userId(), req.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(MembershipDTO.fromEntity(membership));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<MembershipDTO> acceptInvitation(@PathVariable String id) {
        return ResponseEntity.ok(MembershipDTO.fromEntity(membershipService.acceptInvitation(id)));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<MembershipDTO> updateRole(
            @PathVariable String id,
            @RequestBody UpdateRoleRequest req) {
        return ResponseEntity.ok(MembershipDTO.fromEntity(membershipService.updateRole(id, req.role())));
    }

    @PostMapping("/{id}/team")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<MembershipDTO> assignToTeam(
            @PathVariable String id,
            @RequestBody AssignToTeamRequest req) {
        return ResponseEntity.ok(MembershipDTO.fromEntity(membershipService.assignToTeam(id, req.teamId())));
    }

    @DeleteMapping("/{id}/team")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<MembershipDTO> removeFromTeam(@PathVariable String id) {
        return ResponseEntity.ok(MembershipDTO.fromEntity(membershipService.removeFromTeam(id)));
    }

    @PostMapping("/{id}/disable")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> disableMember(@PathVariable String id) {
        membershipService.disableMember(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> removeMember(@PathVariable String id) {
        membershipService.removeMember(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}/organizations")
    public ResponseEntity<List<MembershipDTO>> listOrganizationsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(
            membershipService.listOrganizationsByUser(userId).stream()
                .map(MembershipDTO::fromEntity).toList());
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<MembershipDTO>> listMembersByTeam(@PathVariable String teamId) {
        return ResponseEntity.ok(
            membershipService.listMembersByTeam(teamId).stream()
                .map(MembershipDTO::fromEntity).toList());
    }
}
