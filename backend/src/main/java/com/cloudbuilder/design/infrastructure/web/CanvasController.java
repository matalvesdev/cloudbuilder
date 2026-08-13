package com.cloudbuilder.design.infrastructure.web;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.design.domain.service.CanvasService;
import com.cloudbuilder.shared.monitoring.CustomMetrics;
import com.cloudbuilder.shared.security.TenantContext;
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
import java.security.Principal;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;

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
    public ResponseEntity<Canvas> createCanvas(@Valid @RequestBody CreateCanvasRequest request,
                                                Principal principal) {
        String tenantId = requireTenant();
        Canvas canvas = canvasService.createCanvas(
                tenantId, request.name(), request.description(), principal.getName());
        customMetrics.recordCanvasCreated();
        return ResponseEntity.status(HttpStatus.CREATED).body(canvas);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Canvas>> listCanvases(Pageable pageable) {
        return ResponseEntity.ok(canvasRepository.findByTenantId(requireTenant(), pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Canvas> getCanvas(@PathVariable String id) {
        return ResponseEntity.ok(canvasService.getCanvas(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Canvas> updateCanvas(@PathVariable String id, @Valid @RequestBody UpdateCanvasRequest request) {
        Canvas canvas = canvasService.getCanvas(id);
        canvas.setName(request.name());
        canvas.setDescription(request.description());
        canvas.setMetadata(request.metadata());
        canvasRepository.save(canvas);
        return ResponseEntity.ok(canvas);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCanvas(@PathVariable String id) {
        canvasService.deleteCanvas(id);
        customMetrics.recordCanvasDeleted();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/nodes")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<CanvasNode> addNode(@PathVariable String id, @Valid @RequestBody AddNodeRequest request) {
        CanvasNode node = canvasService.addNode(
                id, request.componentDefinitionId(), request.positionX(), request.positionY(), request.properties(), request.id());
        customMetrics.recordNodeAdded();
        return ResponseEntity.status(HttpStatus.CREATED).body(node);
    }

    @PutMapping("/{id}/nodes/{nodeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<CanvasNode> updateNode(@PathVariable String id, @PathVariable String nodeId,
                                                  @Valid @RequestBody UpdateNodeRequest request) {
        CanvasNode node = canvasService.updateNode(id, nodeId, request.properties());
        return ResponseEntity.ok(node);
    }

    @DeleteMapping("/{id}/nodes/{nodeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Void> removeNode(@PathVariable String id, @PathVariable String nodeId) {
        canvasService.removeNode(id, nodeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/edges")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<CanvasEdge> addEdge(@PathVariable String id, @Valid @RequestBody AddEdgeRequest request) {
        CanvasEdge edge = canvasService.addEdge(
                id, request.sourceNodeId(), request.targetNodeId(), request.edgeType(), request.properties());
        customMetrics.recordEdgeAdded();
        return ResponseEntity.status(HttpStatus.CREATED).body(edge);
    }

    @DeleteMapping("/{id}/edges/{edgeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Void> removeEdge(@PathVariable String id, @PathVariable String edgeId) {
        Canvas canvas = canvasService.getCanvas(id);
        CanvasEdge edge = canvas.getCanvasEdges().stream()
                .filter(e -> e.getId().equals(edgeId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Edge not found: " + edgeId));
        canvas.removeEdge(edge);
        canvasRepository.save(canvas);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/content")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Canvas> replaceContent(
            @PathVariable String id,
            @Valid @RequestBody ReplaceCanvasRequest request) {
        var nodes = request.nodes().stream()
                .map(node -> new CanvasService.NodeSnapshot(
                        node.id(),
                        node.componentDefinitionId(),
                        node.positionX(),
                        node.positionY(),
                        node.properties()))
                .toList();
        var edges = request.edges().stream()
                .map(edge -> new CanvasService.EdgeSnapshot(
                        edge.id(),
                        edge.sourceNodeId(),
                        edge.targetNodeId(),
                        edge.edgeType(),
                        edge.properties()))
                .toList();
        return ResponseEntity.ok(canvasService.replaceContent(
                id,
                request.expectedVersion(),
                request.name(),
                request.metadata(),
                nodes,
                edges));
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
            String properties,
            String id) {}

    public record UpdateNodeRequest(
            String properties) {}

    public record AddEdgeRequest(
            @NotNull String sourceNodeId,
            @NotNull String targetNodeId,
            @NotBlank String edgeType,
            String properties) {}

    public record ReplaceCanvasRequest(
            int expectedVersion,
            @NotBlank String name,
            String metadata,
            @NotNull List<ReplaceNodeRequest> nodes,
            @NotNull List<ReplaceEdgeRequest> edges) {}

    public record ReplaceNodeRequest(
            @NotBlank String id,
            @NotBlank String componentDefinitionId,
            double positionX,
            double positionY,
            String properties) {}

    public record ReplaceEdgeRequest(
            @NotBlank String id,
            @NotBlank String sourceNodeId,
            @NotBlank String targetNodeId,
            @NotBlank String edgeType,
            String properties) {}

    private static String requireTenant() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new AccessDeniedException("No active tenant in authenticated session");
        }
        return tenantId;
    }
}
