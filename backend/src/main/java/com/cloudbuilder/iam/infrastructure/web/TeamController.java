package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.application.dto.TeamDTO;
import com.cloudbuilder.iam.application.dto.TeamDTO.CreateTeamRequest;
import com.cloudbuilder.iam.application.dto.TeamDTO.UpdateTeamRequest;
import com.cloudbuilder.iam.domain.service.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/teams")
@PreAuthorize("isAuthenticated()")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<List<TeamDTO>> listTeams(@PathVariable String organizationId) {
        var teams = teamService.listTeamsByOrganization(organizationId);
        return ResponseEntity.ok(teams.stream().map(TeamDTO::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDTO> getTeam(@PathVariable String id) {
        return ResponseEntity.ok(TeamDTO.fromEntity(teamService.getTeam(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<List<TeamDTO>> searchTeams(
            @PathVariable String organizationId,
            @RequestParam String q) {
        var teams = teamService.searchTeams(organizationId, q);
        return ResponseEntity.ok(teams.stream().map(TeamDTO::fromEntity).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamDTO> createTeam(
            @PathVariable String organizationId,
            @RequestBody CreateTeamRequest req) {
        var team = teamService.createTeam(organizationId, req.name(), req.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(TeamDTO.fromEntity(team));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamDTO> updateTeam(
            @PathVariable String id,
            @RequestBody UpdateTeamRequest req) {
        var team = teamService.updateTeam(id, req.name(), req.description());
        return ResponseEntity.ok(TeamDTO.fromEntity(team));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTeam(@PathVariable String id) {
        teamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }
}
