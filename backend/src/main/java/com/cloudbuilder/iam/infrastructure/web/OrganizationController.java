package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.application.dto.OrganizationDTO;
import com.cloudbuilder.iam.application.dto.OrganizationDTO.CreateOrganizationRequest;
import com.cloudbuilder.iam.application.dto.OrganizationDTO.UpdateOrganizationRequest;
import com.cloudbuilder.iam.domain.service.OrganizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations")
@PreAuthorize("isAuthenticated()")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping
    public ResponseEntity<List<OrganizationDTO>> listOrganizations(Authentication auth) {
        String userId = auth.getName();
        var orgs = organizationService.listOrganizationsByOwner(userId);
        var dtos = orgs.stream()
            .map(org -> OrganizationDTO.fromEntity(org, organizationService.getMemberCount(org.getId())))
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationDTO> getOrganization(@PathVariable String id) {
        var org = organizationService.getOrganization(id);
        return ResponseEntity.ok(OrganizationDTO.fromEntity(org, organizationService.getMemberCount(id)));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<OrganizationDTO> getOrganizationBySlug(@PathVariable String slug) {
        var org = organizationService.getOrganizationBySlug(slug);
        return ResponseEntity.ok(OrganizationDTO.fromEntity(org, organizationService.getMemberCount(org.getId())));
    }

    @PostMapping
    public ResponseEntity<OrganizationDTO> createOrganization(
            @RequestBody CreateOrganizationRequest req,
            Authentication auth) {
        String userId = auth.getName();
        var org = organizationService.createOrganization(req.name(), req.slug(), userId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(OrganizationDTO.fromEntity(org, 1));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrganizationDTO> updateOrganization(
            @PathVariable String id,
            @RequestBody UpdateOrganizationRequest req) {
        var org = organizationService.updateOrganization(id, req.name(), req.settings());
        return ResponseEntity.ok(OrganizationDTO.fromEntity(org, organizationService.getMemberCount(id)));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<OrganizationDTO> deactivateOrganization(@PathVariable String id) {
        var org = organizationService.deactivateOrganization(id);
        return ResponseEntity.ok(OrganizationDTO.fromEntity(org, organizationService.getMemberCount(id)));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<OrganizationDTO> activateOrganization(@PathVariable String id) {
        var org = organizationService.activateOrganization(id);
        return ResponseEntity.ok(OrganizationDTO.fromEntity(org, organizationService.getMemberCount(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteOrganization(@PathVariable String id) {
        organizationService.deleteOrganization(id);
        return ResponseEntity.noContent().build();
    }
}
