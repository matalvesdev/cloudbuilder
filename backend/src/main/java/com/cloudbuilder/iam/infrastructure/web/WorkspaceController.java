package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.application.dto.WorkspaceDTO;
import com.cloudbuilder.iam.application.dto.WorkspaceDTO.CreateWorkspaceRequest;
import com.cloudbuilder.iam.application.dto.WorkspaceDTO.UpdateWorkspaceRequest;
import com.cloudbuilder.iam.domain.service.WorkspaceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/workspaces")
@PreAuthorize("isAuthenticated()")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceDTO>> listWorkspaces(@PathVariable String organizationId) {
        return ResponseEntity.ok(workspaceService.listByOrganization(organizationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceDTO> getWorkspace(@PathVariable String id) {
        return ResponseEntity.ok(workspaceService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<WorkspaceDTO> createWorkspace(
            @PathVariable String organizationId,
            @RequestBody CreateWorkspaceRequest req) {
        var workspace = workspaceService.create(organizationId, req.name(), req.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(workspace);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<WorkspaceDTO> updateWorkspace(
            @PathVariable String id,
            @RequestBody UpdateWorkspaceRequest req) {
        return ResponseEntity.ok(workspaceService.update(id, req.name(), req.description(), req.settings()));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deactivateWorkspace(@PathVariable String id) {
        workspaceService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable String id) {
        workspaceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
