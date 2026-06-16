package com.cloudbuilder.design.infrastructure.web;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.design.domain.service.CanvasService;
import com.cloudbuilder.shared.monitoring.CustomMetrics;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/canvases")
@Validated
public class CanvasController {

    private final CanvasService canvasService;
    private final CanvasRepository canvasRepository;
    private final CustomMetrics customMetrics;

    public CanvasController(CanvasService canvasService, CanvasRepository canvasRepository,
                            CustomMetrics customMetrics) {
        this.canvasService = canvasService;
        this.canvasRepository = canvasRepository;
        this.customMetrics = customMetrics;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Canvas> createCanvas(@Valid @RequestBody CreateCanvasRequest request) {
        Canvas canvas = canvasService.createCanvas(
                request.tenantId(), request.name(), request.description(), request.userId());
        customMetrics.recordCanvasCreated();
        return ResponseEntity.status(HttpStatus.CREATED).body(canvas);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Canvas>> listCanvases(Pageable pageable) {
        return ResponseEntity.ok(canvasRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Canvas> getCanvas(@PathVariable UUID id) {
        return ResponseEntity.ok(canvasService.getCanvas(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Canvas> updateCanvas(@PathVariable UUID id, @Valid @RequestBody UpdateCanvasRequest request) {
        Canvas canvas = canvasService.getCanvas(id);
        canvas.setName(request.name());
        canvas.setDescription(request.description());
        canvas.setMetadata(request.metadata());
        canvasRepository.save(canvas);
        return ResponseEntity.ok(canvas);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCanvas(@PathVariable UUID id) {
        canvasService.deleteCanvas(id);
        customMetrics.recordCanvasDeleted();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/nodes")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<CanvasNode> addNode(@PathVariable UUID id, @Valid @RequestBody AddNodeRequest request) {
        CanvasNode node = canvasService.addNode(
                id, request.componentDefinitionId(), request.positionX(), request.positionY(), request.properties());
        customMetrics.recordNodeAdded();
        return ResponseEntity.status(HttpStatus.CREATED).body(node);
    }

    @PutMapping("/{id}/nodes/{nodeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<CanvasNode> updateNode(@PathVariable UUID id, @PathVariable UUID nodeId,
                                                  @Valid @RequestBody UpdateNodeRequest request) {
        CanvasNode node = canvasService.updateNode(id, nodeId, request.properties());
        return ResponseEntity.ok(node);
    }

    @DeleteMapping("/{id}/nodes/{nodeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Void> removeNode(@PathVariable UUID id, @PathVariable UUID nodeId) {
        canvasService.removeNode(id, nodeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/edges")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<CanvasEdge> addEdge(@PathVariable UUID id, @Valid @RequestBody AddEdgeRequest request) {
        CanvasEdge edge = canvasService.addEdge(
                id, request.sourceNodeId(), request.targetNodeId(), request.edgeType(), request.properties());
        customMetrics.recordEdgeAdded();
        return ResponseEntity.status(HttpStatus.CREATED).body(edge);
    }

    @DeleteMapping("/{id}/edges/{edgeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Void> removeEdge(@PathVariable UUID id, @PathVariable UUID edgeId) {
        Canvas canvas = canvasService.getCanvas(id);
        CanvasEdge edge = canvas.getCanvasEdges().stream()
                .filter(e -> e.getId().equals(edgeId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Edge not found: " + edgeId));
        canvas.removeEdge(edge);
        canvasRepository.save(canvas);
        return ResponseEntity.noContent().build();
    }

    public record CreateCanvasRequest(
            @NotBlank String tenantId,
            @NotBlank String name,
            String description,
            @NotBlank String userId) {}

    public record UpdateCanvasRequest(
            @NotBlank String name,
            String description,
            String metadata) {}

    public record AddNodeRequest(
            @NotBlank String componentDefinitionId,
            double positionX,
            double positionY,
            String properties) {}

    public record UpdateNodeRequest(
            String properties) {}

    public record AddEdgeRequest(
            @NotNull UUID sourceNodeId,
            @NotNull UUID targetNodeId,
            @NotBlank String edgeType,
            String properties) {}
}
