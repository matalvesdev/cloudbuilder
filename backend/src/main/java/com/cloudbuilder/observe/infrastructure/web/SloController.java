package com.cloudbuilder.observe.infrastructure.web;

import com.cloudbuilder.observe.domain.model.SliSnapshot;
import com.cloudbuilder.observe.domain.model.SloDefinition;
import com.cloudbuilder.observe.domain.service.SloService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/observe/slos")
@PreAuthorize("isAuthenticated()")
public class SloController {

    private final SloService sloService;

    public SloController(SloService sloService) {
        this.sloService = sloService;
    }

    /* ─── SLO Definitions ─────────────────────────────────────────── */

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SloDefinition> createSlo(@RequestBody SloDefinition definition) {
        return ResponseEntity.ok(sloService.createSlo(definition));
    }

    @GetMapping
    public ResponseEntity<List<SloDefinition>> getSloDefinitions(
            @RequestParam String environmentId) {
        return ResponseEntity.ok(sloService.getSloDefinitions(environmentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SloDefinition> getSlo(@PathVariable String id) {
        return sloService.getSloById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSlo(@PathVariable String id) {
        sloService.deleteSlo(id);
        return ResponseEntity.noContent().build();
    }

    /* ─── SLI Snapshots ───────────────────────────────────────────── */

    @PostMapping("/{sloId}/snapshots")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SliSnapshot> recordSli(
            @PathVariable String sloId,
            @RequestBody RecordSliRequest request) {
        var snapshot = new SliSnapshot(sloId, request.environmentId(),
                request.sliValue(), request.compliant());
        return ResponseEntity.ok(sloService.recordSli(snapshot));
    }

    @GetMapping("/{sloId}/snapshots")
    public ResponseEntity<List<SliSnapshot>> getSliHistory(
            @PathVariable String sloId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        if (start != null && end != null) {
            return ResponseEntity.ok(sloService.getSliHistoryInRange(sloId, start, end));
        }
        return ResponseEntity.ok(sloService.getSliHistory(sloId));
    }

    /* ─── Compliance Summary ──────────────────────────────────────── */

    @GetMapping("/compliance")
    public ResponseEntity<List<Map<String, Object>>> getCompliance(
            @RequestParam String environmentId) {
        return ResponseEntity.ok(sloService.getComplianceSummary(environmentId));
    }

    record RecordSliRequest(String environmentId, double sliValue, boolean compliant) {}
}
