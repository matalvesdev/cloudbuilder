package com.cloudbuilder.multiregion.infrastructure.web;

import com.cloudbuilder.multiregion.application.dto.CreateRegionRequest;
import com.cloudbuilder.multiregion.application.dto.RegionDto;
import com.cloudbuilder.multiregion.domain.model.DisasterRecoveryPlan;
import com.cloudbuilder.multiregion.domain.model.ReplicationConfig;
import com.cloudbuilder.multiregion.domain.service.DisasterRecoveryService;
import com.cloudbuilder.multiregion.domain.service.RegionService;
import com.cloudbuilder.multiregion.domain.service.ReplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/multiregion/regions")
@PreAuthorize("isAuthenticated()")
public class RegionController {

    private final RegionService regionService;
    private final ReplicationService replicationService;
    private final DisasterRecoveryService disasterRecoveryService;

    public RegionController(RegionService regionService,
                            ReplicationService replicationService,
                            DisasterRecoveryService disasterRecoveryService) {
        this.regionService = regionService;
        this.replicationService = replicationService;
        this.disasterRecoveryService = disasterRecoveryService;
    }

    @PostMapping
    public ResponseEntity<RegionDto> createRegion(@RequestBody CreateRegionRequest request) {
        var region = regionService.createRegion(
            request.code(), request.name(), request.provider(),
            request.country(), request.isPrimary()
        );
        return ResponseEntity.ok(RegionDto.from(region));
    }

    @GetMapping
    public ResponseEntity<List<RegionDto>> getAllRegions() {
        var regions = regionService.getAllRegions().stream()
            .map(RegionDto::from)
            .toList();
        return ResponseEntity.ok(regions);
    }

    @GetMapping("/active")
    public ResponseEntity<List<RegionDto>> getActiveRegions() {
        var regions = regionService.getActiveRegions().stream()
            .map(RegionDto::from)
            .toList();
        return ResponseEntity.ok(regions);
    }

    @GetMapping("/active/provider/{provider}")
    public ResponseEntity<List<RegionDto>> getActiveRegionsByProvider(@PathVariable String provider) {
        var regions = regionService.getActiveRegionsByProvider(provider).stream()
            .map(RegionDto::from)
            .toList();
        return ResponseEntity.ok(regions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegionDto> getRegion(@PathVariable String id) {
        return regionService.getRegion(id)
            .map(RegionDto::from)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<RegionDto> getRegionByCode(@PathVariable String code) {
        return regionService.getRegionByCode(code)
            .map(RegionDto::from)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<RegionDto> updateRegion(
            @PathVariable String id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean isPrimary) {
        var region = regionService.updateRegion(id, name, country, isActive, isPrimary);
        return ResponseEntity.ok(RegionDto.from(region));
    }

    @PutMapping("/{id}/primary")
    public ResponseEntity<RegionDto> setPrimaryRegion(@PathVariable String id) {
        var region = regionService.setPrimaryRegion(id);
        return ResponseEntity.ok(RegionDto.from(region));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRegion(@PathVariable String id) {
        regionService.deleteRegion(id);
        return ResponseEntity.noContent().build();
    }

    // ── Replication Config endpoints ──────────────────────────────────

    @PostMapping("/replication")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReplicationConfig> createReplicationConfig(@RequestBody CreateReplicationRequest req) {
        var config = replicationService.createConfig(
                req.tenantId(), req.planId(), req.sourceRegionId(),
                req.targetRegionId(), req.resourceType(), req.strategy());
        return ResponseEntity.status(HttpStatus.CREATED).body(config);
    }

    @GetMapping("/replication/{id}")
    public ResponseEntity<ReplicationConfig> getReplicationConfig(@PathVariable String id) {
        return replicationService.getConfig(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/replication/plan/{planId}")
    public ResponseEntity<List<ReplicationConfig>> getReplicationConfigsByPlan(@PathVariable String planId) {
        return ResponseEntity.ok(replicationService.getConfigsByPlan(planId));
    }

    @GetMapping("/replication/tenant/{tenantId}")
    public ResponseEntity<List<ReplicationConfig>> getReplicationConfigsByTenant(@PathVariable String tenantId) {
        return ResponseEntity.ok(replicationService.getConfigsByTenant(tenantId));
    }

    @PostMapping("/replication/{id}/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReplicationConfig> triggerSync(@PathVariable String id) {
        return ResponseEntity.ok(replicationService.triggerSync(id));
    }

    @PostMapping("/replication/{id}/pause")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReplicationConfig> pauseReplication(@PathVariable String id) {
        return ResponseEntity.ok(replicationService.pauseConfig(id));
    }

    @PostMapping("/replication/{id}/resume")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReplicationConfig> resumeReplication(@PathVariable String id) {
        return ResponseEntity.ok(replicationService.resumeConfig(id));
    }

    @DeleteMapping("/replication/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReplicationConfig(@PathVariable String id) {
        replicationService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }

    // ── Auto-Failover endpoints ───────────────────────────────────────

    @PostMapping("/dr/plans/{planId}/auto-failover")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DisasterRecoveryPlan> triggerAutoFailover(@PathVariable String planId) {
        var plan = disasterRecoveryService.getPlan(planId)
                .orElseThrow(() -> new IllegalArgumentException("DR plan not found: " + planId));
        return ResponseEntity.ok(disasterRecoveryService.executeAutoFailover(plan));
    }

    @PostMapping("/dr/plans/{planId}/verify-failover")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> verifyFailover(@PathVariable String planId) {
        return ResponseEntity.ok(disasterRecoveryService.verifyFailover(planId));
    }

    record CreateReplicationRequest(String tenantId, String planId, String sourceRegionId,
                                     String targetRegionId, String resourceType, String strategy) {}
}