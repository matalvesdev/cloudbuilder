package com.cloudbuilder.observe.infrastructure.web;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.observe.domain.model.Alert;
import com.cloudbuilder.observe.domain.model.ServiceHealth;
import com.cloudbuilder.observe.domain.port.AlertRepository;
import com.cloudbuilder.observe.domain.port.ServiceHealthRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service Map — Ponte entre Design (canvas) e Observabilidade (health + alerts).
 * Enriquece cada nó do canvas com status de saúde em tempo real,
 * transformando o visual designer em um service map de observabilidade.
 */
@RestController
@RequestMapping("/api/v1/service-map")
public class ServiceMapController {

    private final CanvasRepository canvasRepository;
    private final ServiceHealthRepository serviceHealthRepository;
    private final AlertRepository alertRepository;

    public ServiceMapController(CanvasRepository canvasRepository,
                                ServiceHealthRepository serviceHealthRepository,
                                AlertRepository alertRepository) {
        this.canvasRepository = canvasRepository;
        this.serviceHealthRepository = serviceHealthRepository;
        this.alertRepository = alertRepository;
    }

    /**
     * GET /api/v1/service-map/{canvasId}
     * Retorna o canvas como service map: nós + edges + status de saúde + alertas ativos.
     */
    @GetMapping("/{canvasId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ServiceMapResponse> getServiceMap(@PathVariable String canvasId) {
        var canvas = canvasRepository.findById(canvasId)
                .orElseThrow(() -> new IllegalArgumentException("Canvas not found: " + canvasId));

        var envId = extractEnvironmentId(canvas);
        var healthMap = buildHealthMap(envId);
        var alertsBySource = buildAlertMap(envId);

        var nodes = canvas.getCanvasNodes().stream()
                .map(n -> enrichNode(n, healthMap, alertsBySource))
                .toList();

        var edges = canvas.getCanvasEdges().stream()
                .map(e -> new ServiceMapEdge(e.getId(), e.getSourceNodeId(), e.getTargetNodeId(), e.getEdgeType()))
                .toList();

        var overallStatus = computeOverallStatus(nodes);

        return ResponseEntity.ok(new ServiceMapResponse(
                canvas.getId(), canvas.getName(), envId, overallStatus, nodes, edges));
    }

    /** GET /api/v1/service-map — lista todos os canvases como service maps resumidos */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ServiceMapSummary>> listServiceMaps() {
        var canvases = canvasRepository.findAll();
        var summaries = canvases.stream().map(c -> {
            var envId = extractEnvironmentId(c);
            var healths = serviceHealthRepository.findByEnvironmentId(envId);
            var openAlerts = alertRepository.findByStatus("OPEN").stream()
                    .filter(a -> a.getEnvironmentId().equals(envId))
                    .count();
            var degraded = healths.stream().filter(h -> "degraded".equals(h.getStatus())).count();
            var down = healths.stream().filter(h -> "down".equals(h.getStatus())).count();
            var status = down > 0 ? "critical" : degraded > 0 ? "degraded" : healths.isEmpty() ? "unknown" : "healthy";
            return new ServiceMapSummary(c.getId(), c.getName(), envId, status, healths.size(), (int) openAlerts);
        }).toList();
        return ResponseEntity.ok(summaries);
    }

    /* ─── Helpers ───────────────────────────────────────────────────── */

    private String extractEnvironmentId(Canvas canvas) {
        var meta = canvas.getMetadata();
        if (meta != null && !meta.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                var map = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(meta, java.util.Map.class);
                var env = map.get("environmentId");
                if (env != null) return env.toString();
            } catch (Exception ignored) {}
        }
        return "default";
    }

    private Map<String, ServiceHealth> buildHealthMap(String envId) {
        return serviceHealthRepository.findByEnvironmentId(envId)
                .stream()
                .collect(Collectors.toMap(
                        ServiceHealth::getServiceName,
                        h -> h,
                        (a, b) -> a.getCheckedAt().isAfter(b.getCheckedAt()) ? a : b
                ));
    }

    private Map<String, List<Alert>> buildAlertMap(String envId) {
        return alertRepository.findByEnvironmentId(envId)
                .stream()
                .filter(a -> "OPEN".equals(a.getStatus()))
                .collect(Collectors.groupingBy(Alert::getSource));
    }

    private ServiceMapNode enrichNode(CanvasNode node, Map<String, ServiceHealth> healthMap,
                                       Map<String, List<Alert>> alertsBySource) {
        var nodeId = node.getId();
        var resourceType = extractResourceType(node);
        var sourceName = resourceType != null ? resourceType : nodeId.toString();

        var health = healthMap.get(sourceName);
        var nodeAlerts = alertsBySource.getOrDefault(sourceName, List.of());

        var status = "unknown";
        var latencyMs = 0.0;
        var uptimePercent = 100.0;
        var alertCount = nodeAlerts.size();
        var hasCriticalAlert = nodeAlerts.stream().anyMatch(a -> "critical".equals(a.getSeverity()));

        if (health != null) {
            status = health.getStatus();
            latencyMs = health.getLatencyMs();
            uptimePercent = health.getUptimePercent();
        }

        return new ServiceMapNode(
                nodeId, node.getComponentDefinitionId(), node.getPositionX(), node.getPositionY(),
                status, latencyMs, uptimePercent, alertCount, hasCriticalAlert);
    }

    private String extractResourceType(CanvasNode node) {
        var props = node.getProperties();
        if (props != null && !props.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                var map = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(props, java.util.Map.class);
                var name = map.get("resourceName");
                if (name != null) return name.toString();
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String computeOverallStatus(List<ServiceMapNode> nodes) {
        var hasCritical = nodes.stream().anyMatch(ServiceMapNode::hasCriticalAlert);
        var hasDown = nodes.stream().anyMatch(n -> "down".equals(n.status()));
        var hasDegraded = nodes.stream().anyMatch(n -> "degraded".equals(n.status()));
        if (hasCritical || hasDown) return "critical";
        if (hasDegraded) return "degraded";
        var hasUnknown = nodes.stream().anyMatch(n -> "unknown".equals(n.status()));
        return hasUnknown ? "unknown" : "healthy";
    }

    /* ─── DTOs ──────────────────────────────────────────────────────── */

    public record ServiceMapResponse(
            String canvasId, String canvasName, String environmentId,
            String overallStatus, List<ServiceMapNode> nodes, List<ServiceMapEdge> edges) {}

    public record ServiceMapNode(
            String nodeId, String componentDefinitionId,
            double positionX, double positionY,
            String status, double latencyMs, double uptimePercent,
            int alertCount, boolean hasCriticalAlert) {}

    public record ServiceMapEdge(
            String edgeId, String sourceNodeId, String targetNodeId, String edgeType) {}

    public record ServiceMapSummary(
            String canvasId, String canvasName, String environmentId,
            String status, int serviceCount, int activeAlerts) {}
}
