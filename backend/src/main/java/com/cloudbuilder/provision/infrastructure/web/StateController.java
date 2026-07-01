package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.provision.application.dto.DriftReportResponseDTO;
import com.cloudbuilder.provision.application.dto.ResolveDriftRequest;
import com.cloudbuilder.provision.application.dto.StateSyncRequest;
import com.cloudbuilder.provision.domain.model.ManagedResource;
import com.cloudbuilder.provision.domain.service.DriftDetectionService;
import com.cloudbuilder.provision.domain.service.StateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/environments/{environmentId}")
@PreAuthorize("isAuthenticated()")
public class StateController {

    private final StateService stateService;
    private final DriftDetectionService driftDetectionService;
    private final ObjectMapper objectMapper;

    public StateController(StateService stateService, DriftDetectionService driftDetectionService, ObjectMapper objectMapper) {
        this.stateService = stateService;
        this.driftDetectionService = driftDetectionService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/resources")
    public ResponseEntity<List<ManagedResource>> listResources(@PathVariable String environmentId) {
        List<ManagedResource> resources = stateService.getResourcesByEnvironment(environmentId);
        return ResponseEntity.ok(resources);
    }

    @PostMapping("/sync")
    public ResponseEntity<List<ManagedResource>> syncResources(
            @PathVariable String environmentId,
            @RequestBody StateSyncRequest request) {
        List<ManagedResource> resources = stateService.syncResourcesFromState(environmentId, request.stateJson());
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/drift")
    public ResponseEntity<DriftReportResponseDTO> getLatestDrift(@PathVariable String environmentId) {
        return driftDetectionService.getLatestDrift(environmentId)
            .map(report -> ResponseEntity.ok(DriftReportResponseDTO.from(report, objectMapper)))
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/drift/history")
    public ResponseEntity<List<DriftReportResponseDTO>> getDriftHistory(@PathVariable String environmentId) {
        List<DriftReportResponseDTO> dtos = driftDetectionService.getDriftHistory(environmentId)
            .stream()
            .map(report -> DriftReportResponseDTO.from(report, objectMapper))
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/drift/resolve/{reportId}")
    public ResponseEntity<DriftReportResponseDTO> resolveDrift(
            @PathVariable String environmentId,
            @PathVariable String reportId,
            @RequestBody ResolveDriftRequest request) {
        var report = driftDetectionService.resolveDrift(reportId, request.resolvedBy());
        return ResponseEntity.ok(DriftReportResponseDTO.from(report, objectMapper));
    }

    @PostMapping("/detect-drift")
    public ResponseEntity<DriftReportResponseDTO> detectDrift(
            @PathVariable String environmentId,
            @RequestBody StateSyncRequest request) {
        var report = driftDetectionService.detectDrift(environmentId, request.stateJson());
        return ResponseEntity.ok(DriftReportResponseDTO.from(report, objectMapper));
    }
}
