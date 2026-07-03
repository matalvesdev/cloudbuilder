package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.application.dto.ProjectDTO;
import com.cloudbuilder.iam.application.dto.ProjectDTO.CreateProjectRequest;
import com.cloudbuilder.iam.application.dto.ProjectDTO.UpdateProjectRequest;
import com.cloudbuilder.iam.domain.service.ProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/projects")
@PreAuthorize("isAuthenticated()")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<ProjectDTO>> listProjects(@PathVariable String organizationId) {
        var projects = projectService.listProjectsByOrganization(organizationId);
        return ResponseEntity.ok(projects.stream().map(ProjectDTO::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDTO> getProject(@PathVariable String id) {
        return ResponseEntity.ok(ProjectDTO.fromEntity(projectService.getProject(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProjectDTO>> searchProjects(
            @PathVariable String organizationId,
            @RequestParam String q) {
        var projects = projectService.searchProjects(organizationId, q);
        return ResponseEntity.ok(projects.stream().map(ProjectDTO::fromEntity).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectDTO> createProject(
            @PathVariable String organizationId,
            @RequestBody CreateProjectRequest req) {
        var project = projectService.createProject(organizationId, req.name(), req.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectDTO.fromEntity(project));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectDTO> updateProject(
            @PathVariable String id,
            @RequestBody UpdateProjectRequest req) {
        var project = projectService.updateProject(id, req.name(), req.description(), req.settings());
        return ResponseEntity.ok(ProjectDTO.fromEntity(project));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectDTO> deactivateProject(@PathVariable String id) {
        return ResponseEntity.ok(ProjectDTO.fromEntity(projectService.deactivateProject(id)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectDTO> activateProject(@PathVariable String id) {
        return ResponseEntity.ok(ProjectDTO.fromEntity(projectService.activateProject(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
