package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.model.KnowledgeGraph;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

/**
 * Builds and queries a KnowledgeGraph from canvas architecture data.
 * Traverses nodes (components) and edges (relationships) to produce
 * a graph that powers AI context building, impact analysis, and documentation.
 */
@Service
public class KnowledgeGraphService {

    private final CanvasRepository canvasRepository;

    public KnowledgeGraphService(CanvasRepository canvasRepository) {
        this.canvasRepository = canvasRepository;
    }

    /** Build a KnowledgeGraph from a canvas's nodes and edges. */
    public KnowledgeGraph buildGraph(String canvasId) {
        Optional<Canvas> canvasOpt = canvasRepository.findById(canvasId);
        if (canvasOpt.isEmpty()) return new KnowledgeGraph();

        Canvas canvas = canvasOpt.get();
        KnowledgeGraph graph = new KnowledgeGraph();

        // Add nodes — CanvasNode has componentDefinitionId, positionX/Y, properties (JSON)
        for (CanvasNode node : canvas.getCanvasNodes()) {
            Map<String, String> metadata = Map.of(
                "componentDefinitionId", node.getComponentDefinitionId() != null ? node.getComponentDefinitionId() : "",
                "positionX", String.valueOf(node.getPositionX()),
                "positionY", String.valueOf(node.getPositionY())
            );
            String label = node.getComponentDefinitionId() != null ? node.getComponentDefinitionId() : node.getId();
            graph.addNode(node.getId(), label, "component", metadata);
        }

        // Add edges
        for (CanvasEdge edge : canvas.getCanvasEdges()) {
            Map<String, String> metadata = Map.of(
                "edgeType", edge.getEdgeType() != null ? edge.getEdgeType() : "default"
            );
            graph.addEdge(
                edge.getSourceNodeId(),
                edge.getTargetNodeId(),
                edge.getEdgeType() != null ? edge.getEdgeType() : "connected",
                metadata
            );
        }

        return graph;
    }

    /** Generate a context summary for AI consumption. */
    public String buildAiContext(String canvasId) {
        KnowledgeGraph graph = buildGraph(canvasId);
        if (graph.nodeCount() == 0) return "No architecture components found.";

        StringBuilder sb = new StringBuilder();
        sb.append("Architecture Graph Summary:\n");
        sb.append("Components: ").append(graph.nodeCount()).append("\n");
        sb.append("Connections: ").append(graph.edgeCount()).append("\n\n");

        // Group nodes by type
        sb.append("Components:\n");
        for (KnowledgeGraph.GraphNode node : graph.getNodes()) {
            sb.append("  - ").append(node.label()).append(" (").append(node.type()).append(")\n");
        }

        sb.append("\nConnections:\n");
        for (KnowledgeGraph.GraphEdge edge : graph.getEdges()) {
            Optional<KnowledgeGraph.GraphNode> source = graph.getNode(edge.sourceId());
            Optional<KnowledgeGraph.GraphNode> target = graph.getNode(edge.targetId());
            if (source.isPresent() && target.isPresent()) {
                sb.append("  ").append(source.get().label())
                  .append(" --[").append(edge.relationship()).append("]--> ")
                  .append(target.get().label()).append("\n");
            }
        }

        return sb.toString();
    }

    /** Analyze impact of removing a component. */
    public Map<String, Object> analyzeImpact(String canvasId, String nodeId) {
        KnowledgeGraph graph = buildGraph(canvasId);
        var impacted = graph.findImpact(nodeId);
        var dependencies = graph.getDependencies(nodeId);
        var dependents = graph.getDependents(nodeId);

        return Map.of(
            "nodeId", nodeId,
            "directDependents", dependents.stream().map(KnowledgeGraph.GraphNode::label).toList(),
            "directDependencies", dependencies.stream().map(KnowledgeGraph.GraphNode::label).toList(),
            "transitiveImpact", impacted,
            "impactCount", impacted.size()
        );
    }
}
