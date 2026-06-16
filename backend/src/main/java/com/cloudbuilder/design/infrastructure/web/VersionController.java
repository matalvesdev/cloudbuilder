package com.cloudbuilder.design.infrastructure.web;

import com.cloudbuilder.design.application.dto.VersionDiff;
import com.cloudbuilder.design.domain.model.CanvasVersion;
import com.cloudbuilder.design.domain.service.VersionService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/canvases/{canvasId}/versions")
@Validated
public class VersionController {

    private final VersionService versionService;

    public VersionController(VersionService versionService) {
        this.versionService = versionService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CanvasVersion>> listVersions(@PathVariable UUID canvasId) {
        return ResponseEntity.ok(versionService.getVersions(canvasId));
    }

    @GetMapping("/{version}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CanvasVersion> getVersion(@PathVariable UUID canvasId, @PathVariable int version) {
        return ResponseEntity.ok(versionService.getVersion(canvasId, version));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CanvasVersion> createVersion(
            @PathVariable UUID canvasId,
            @Validated @RequestBody CreateVersionRequest request) {
        CanvasVersion version = versionService.createVersion(canvasId, request.changeDescription(), request.createdBy());
        return ResponseEntity.status(HttpStatus.CREATED).body(version);
    }

    @PostMapping("/rollback/{version}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> rollbackToVersion(@PathVariable UUID canvasId, @PathVariable int version) {
        versionService.rollbackToVersion(canvasId, version);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/diff")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VersionDiff> diffVersions(
            @PathVariable UUID canvasId,
            @RequestParam("from") int from,
            @RequestParam("to") int to) {
        return ResponseEntity.ok(versionService.diffVersions(canvasId, from, to));
    }

    public record CreateVersionRequest(
            @NotBlank String changeDescription,
            @NotBlank String createdBy) {}
}
