package com.cloudbuilder.tenant.infrastructure.web;

import com.cloudbuilder.tenant.application.dto.CreateProjectRequest;
import com.cloudbuilder.tenant.application.dto.InviteMemberRequest;
import com.cloudbuilder.tenant.application.dto.UpdateMemberRoleRequest;
import com.cloudbuilder.tenant.domain.model.Project;
import com.cloudbuilder.tenant.domain.model.ProjectMember;
import com.cloudbuilder.tenant.domain.service.ProjectService;
import com.cloudbuilder.shared.security.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@Validated
@PreAuthorize("isAuthenticated()")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Project> createProject(@Valid @RequestBody CreateProjectRequest req) {
        Project project = projectService.createProject(
                TenantContext.getTenantId(),
                req.name(), req.description(),
                "current-user", "Admin", "admin@cloudbuilder.dev");
        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    @GetMapping
    public ResponseEntity<List<Project>> listProjects() {
        return ResponseEntity.ok(
                projectService.getProjectsByTenant(TenantContext.getTenantId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProject(@PathVariable UUID id) {
        return projectService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Project> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody CreateProjectRequest req) {
        return ResponseEntity.ok(projectService.updateProject(id, req.name(), req.description()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<ProjectMember>> getMembers(@PathVariable UUID projectId) {
        return ResponseEntity.ok(projectService.getMembers(projectId));
    }

    @PostMapping("/{projectId}/members")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectMember> inviteMember(
            @PathVariable UUID projectId,
            @Valid @RequestBody InviteMemberRequest req) {
        ProjectMember member = projectService.inviteMember(
                projectId, req.email(), req.email().split("@")[0],
                req.email(), req.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID projectId, @PathVariable String userId) {
        projectService.removeMember(projectId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{projectId}/members/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectMember> updateMemberRole(
            @PathVariable UUID projectId,
            @PathVariable String userId,
            @Valid @RequestBody UpdateMemberRoleRequest req) {
        return ResponseEntity.ok(
                projectService.updateMemberRole(projectId, userId, req.role()));
    }
}
