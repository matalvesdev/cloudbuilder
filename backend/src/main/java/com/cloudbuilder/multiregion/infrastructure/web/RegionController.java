package com.cloudbuilder.multiregion.infrastructure.web;

import com.cloudbuilder.multiregion.application.dto.CreateRegionRequest;
import com.cloudbuilder.multiregion.application.dto.RegionDto;
import com.cloudbuilder.multiregion.domain.service.RegionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/multiregion/regions")
@PreAuthorize("isAuthenticated()")
public class RegionController {

    private final RegionService regionService;

    public RegionController(RegionService regionService) {
        this.regionService = regionService;
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
    public ResponseEntity<RegionDto> getRegion(@PathVariable UUID id) {
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
            @PathVariable UUID id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean isPrimary) {
        var region = regionService.updateRegion(id, name, country, isActive, isPrimary);
        return ResponseEntity.ok(RegionDto.from(region));
    }

    @PutMapping("/{id}/primary")
    public ResponseEntity<RegionDto> setPrimaryRegion(@PathVariable UUID id) {
        var region = regionService.setPrimaryRegion(id);
        return ResponseEntity.ok(RegionDto.from(region));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRegion(@PathVariable UUID id) {
        regionService.deleteRegion(id);
        return ResponseEntity.noContent().build();
    }
}