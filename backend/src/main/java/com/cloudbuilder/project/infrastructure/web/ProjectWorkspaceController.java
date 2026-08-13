package com.cloudbuilder.project.infrastructure.web;

import com.cloudbuilder.project.application.dto.ProjectDTO;
import com.cloudbuilder.project.domain.model.Project;
import com.cloudbuilder.project.domain.service.ProjectWorkspaceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/project-workspaces")
public class ProjectWorkspaceController {

    private final ProjectWorkspaceService projectService;

    public ProjectWorkspaceController(ProjectWorkspaceService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ProjectDTO> createProject(
            @RequestParam String tenantId,
            @RequestBody Map<String, String> body) {
        Project project = projectService.createProject(
            tenantId, body.get("name"), body.get("description"), body.get("slug"));
        return ResponseEntity.ok(ProjectDTO.from(project));
    }

    @GetMapping
    public ResponseEntity<Page<ProjectDTO>> listProjects(
            @RequestParam String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
            projectService.listProjects(tenantId, PageRequest.of(page, size))
                .map(ProjectDTO::from)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDTO> getProject(@PathVariable String id) {
        return ResponseEntity.ok(ProjectDTO.from(projectService.getProject(id)));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<ProjectDTO> archiveProject(@PathVariable String id) {
        return ResponseEntity.ok(ProjectDTO.from(projectService.archiveProject(id)));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<ProjectDTO> activateProject(@PathVariable String id) {
        return ResponseEntity.ok(ProjectDTO.from(projectService.activateProject(id)));
    }
}
