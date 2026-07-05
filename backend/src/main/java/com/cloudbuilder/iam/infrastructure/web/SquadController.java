package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.application.dto.SquadDTO;
import com.cloudbuilder.iam.application.dto.SquadDTO.CreateSquadRequest;
import com.cloudbuilder.iam.application.dto.SquadDTO.UpdateSquadRequest;
import com.cloudbuilder.iam.domain.service.SquadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/squads")
@PreAuthorize("isAuthenticated()")
public class SquadController {

    private final SquadService squadService;

    public SquadController(SquadService squadService) {
        this.squadService = squadService;
    }

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<List<SquadDTO>> listSquadsByWorkspace(
            @PathVariable String workspaceId) {
        var squads = squadService.listSquadsByWorkspace(workspaceId);
        return ResponseEntity.ok(squads.stream().map(SquadDTO::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SquadDTO> getSquad(@PathVariable String id) {
        return ResponseEntity.ok(SquadDTO.fromEntity(squadService.getSquad(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<List<SquadDTO>> searchSquads(
            @RequestParam String workspaceId,
            @RequestParam String q) {
        var squads = squadService.searchSquads(workspaceId, q);
        return ResponseEntity.ok(squads.stream().map(SquadDTO::fromEntity).toList());
    }

    @GetMapping("/count")
    public ResponseEntity<Long> countSquads(@RequestParam String workspaceId) {
        return ResponseEntity.ok(squadService.countSquads(workspaceId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SquadDTO> createSquad(
            @PathVariable String organizationId,
            @RequestBody CreateSquadRequest req) {
        // Use tenantId from header or default
        var tenantId = req.workspaceId(); // simplified — tenant derived from workspace context
        var squad = squadService.createSquad(
            organizationId, req.workspaceId(), tenantId, req.name(), req.description(), req.leadId());
        return ResponseEntity.status(HttpStatus.CREATED).body(SquadDTO.fromEntity(squad));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SquadDTO> updateSquad(
            @PathVariable String id,
            @RequestBody UpdateSquadRequest req) {
        var squad = squadService.updateSquad(id, req.name(), req.description(), req.leadId());
        return ResponseEntity.ok(SquadDTO.fromEntity(squad));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSquad(@PathVariable String id) {
        squadService.deleteSquad(id);
        return ResponseEntity.noContent().build();
    }
}
