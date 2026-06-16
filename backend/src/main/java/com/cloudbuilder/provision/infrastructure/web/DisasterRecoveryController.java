package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.provision.domain.model.DrillConfig;
import com.cloudbuilder.provision.domain.model.FailoverGroup;
import com.cloudbuilder.provision.domain.model.RegionDeployment;
import com.cloudbuilder.provision.domain.service.DisasterRecoveryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dr")
@PreAuthorize("isAuthenticated()")
public class DisasterRecoveryController {

    private final DisasterRecoveryService drService;

    public DisasterRecoveryController(DisasterRecoveryService drService) {
        this.drService = drService;
    }

    // --- Region Deployments ---

    @GetMapping("/environments/{environmentId}/regions")
    public ResponseEntity<List<RegionDeployment>> getRegions(@PathVariable UUID environmentId) {
        return ResponseEntity.ok(drService.getRegionDeployments(environmentId));
    }

    @PostMapping("/environments/{environmentId}/regions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegionDeployment> addRegion(
            @PathVariable UUID environmentId, @RequestBody AddRegionRequest req) {
        var deployment = drService.addRegionDeployment(
            environmentId, req.region(), req.primary(), req.priority());
        return ResponseEntity.status(HttpStatus.CREATED).body(deployment);
    }

    @PutMapping("/regions/{deploymentId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegionDeployment> updateRegionStatus(
            @PathVariable UUID deploymentId, @RequestBody StatusRequest req) {
        return ResponseEntity.ok(drService.updateRegionStatus(deploymentId, req.status()));
    }

    // --- Failover Groups ---

    @GetMapping("/environments/{environmentId}/groups")
    public ResponseEntity<List<FailoverGroup>> getFailoverGroups(@PathVariable UUID environmentId) {
        return ResponseEntity.ok(drService.getFailoverGroups(environmentId));
    }

    @PostMapping("/environments/{environmentId}/groups")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FailoverGroup> createFailoverGroup(
            @PathVariable UUID environmentId, @RequestBody CreateGroupRequest req) {
        var group = drService.createFailoverGroup(
            environmentId, req.name(), req.primaryRegion(),
            req.secondaryRegions(), req.failoverThresholdMinutes(), req.autoFailover());
        return ResponseEntity.status(HttpStatus.CREATED).body(group);
    }

    @PostMapping("/groups/{groupId}/failover")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FailoverGroup> initiateFailover(@PathVariable UUID groupId) {
        return ResponseEntity.ok(drService.initiateFailover(groupId));
    }

    @PostMapping("/groups/{groupId}/complete-failover")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FailoverGroup> completeFailover(
            @PathVariable UUID groupId, @RequestBody CompleteFailoverRequest req) {
        return ResponseEntity.ok(drService.completeFailover(groupId, req.newPrimaryRegion()));
    }

    // --- Drills ---

    @GetMapping("/groups/{groupId}/drills")
    public ResponseEntity<List<DrillConfig>> getDrills(@PathVariable UUID groupId) {
        return ResponseEntity.ok(drService.getDrills(groupId));
    }

    @PostMapping("/groups/{groupId}/drills")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DrillConfig> scheduleDrill(
            @PathVariable UUID groupId, @RequestBody ScheduleDrillRequest req) {
        var drill = drService.scheduleDrill(
            groupId, req.name(), req.description(),
            req.scheduledAt() != null ? Instant.parse(req.scheduledAt()) : null);
        return ResponseEntity.status(HttpStatus.CREATED).body(drill);
    }

    @PostMapping("/drills/{drillId}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DrillConfig> completeDrill(
            @PathVariable UUID drillId, @RequestBody CompleteDrillRequest req) {
        return ResponseEntity.ok(drService.completeDrill(drillId, req.passed(), req.result()));
    }

    // --- Request Records ---

    record AddRegionRequest(String region, boolean primary, int priority) {}
    record StatusRequest(String status) {}
    record CreateGroupRequest(String name, String primaryRegion, String secondaryRegions,
                              int failoverThresholdMinutes, boolean autoFailover) {}
    record CompleteFailoverRequest(String newPrimaryRegion) {}
    record ScheduleDrillRequest(String name, String description, String scheduledAt) {}
    record CompleteDrillRequest(boolean passed, String result) {}
}
