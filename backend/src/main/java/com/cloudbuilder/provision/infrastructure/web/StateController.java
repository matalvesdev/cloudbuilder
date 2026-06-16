package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.provision.application.dto.ResolveDriftRequest;
import com.cloudbuilder.provision.application.dto.StateSyncRequest;
import com.cloudbuilder.provision.domain.model.DriftReport;
import com.cloudbuilder.provision.domain.model.ManagedResource;
import com.cloudbuilder.provision.domain.service.DriftDetectionService;
import com.cloudbuilder.provision.domain.service.StateService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/environments/{environmentId}")
@PreAuthorize("isAuthenticated()")
public class StateController {

    private final StateService stateService;
    private final DriftDetectionService driftDetectionService;

    public StateController(StateService stateService, DriftDetectionService driftDetectionService) {
        this.stateService = stateService;
        this.driftDetectionService = driftDetectionService;
    }

    @GetMapping("/resources")
    public ResponseEntity<List<ManagedResource>> listResources(@PathVariable UUID environmentId) {
        List<ManagedResource> resources = stateService.getResourcesByEnvironment(environmentId);
        return ResponseEntity.ok(resources);
    }

    @PostMapping("/sync")
    public ResponseEntity<List<ManagedResource>> syncResources(
            @PathVariable UUID environmentId,
            @RequestBody StateSyncRequest request) {
        List<ManagedResource> resources = stateService.syncResourcesFromState(environmentId, request.stateJson());
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/drift")
    public ResponseEntity<DriftReport> getLatestDrift(@PathVariable UUID environmentId) {
        Optional<DriftReport> latest = driftDetectionService.getLatestDrift(environmentId);
        return latest.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/drift/history")
    public ResponseEntity<List<DriftReport>> getDriftHistory(@PathVariable UUID environmentId) {
        List<DriftReport> history = driftDetectionService.getDriftHistory(environmentId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/drift/resolve/{reportId}")
    public ResponseEntity<DriftReport> resolveDrift(
            @PathVariable UUID environmentId,
            @PathVariable UUID reportId,
            @RequestBody ResolveDriftRequest request) {
        DriftReport report = driftDetectionService.resolveDrift(reportId, request.resolvedBy());
        return ResponseEntity.ok(report);
    }

    @PostMapping("/detect-drift")
    public ResponseEntity<DriftReport> detectDrift(
            @PathVariable UUID environmentId,
            @RequestBody StateSyncRequest request) {
        DriftReport report = driftDetectionService.detectDrift(environmentId, request.stateJson());
        return ResponseEntity.ok(report);
    }
}
