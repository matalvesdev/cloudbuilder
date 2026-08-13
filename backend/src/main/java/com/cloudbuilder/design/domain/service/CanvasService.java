package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.domain.event.CanvasCreatedEvent;
import com.cloudbuilder.design.domain.event.ComponentAddedEvent;
import com.cloudbuilder.design.domain.event.CanvasContentReplacedEvent;
import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.dao.OptimisticLockingFailureException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class CanvasService {

    private final CanvasRepository canvasRepository;
    private final ApplicationEventPublisher eventPublisher;

    public CanvasService(CanvasRepository canvasRepository, ApplicationEventPublisher eventPublisher) {
        this.canvasRepository = canvasRepository;
        this.eventPublisher = eventPublisher;
    }

    public Canvas createCanvas(String tenantId, String name, String description, String userId) {
        Canvas canvas = new Canvas(tenantId, name, description, userId);
        canvas = canvasRepository.save(canvas);
        eventPublisher.publishEvent(new CanvasCreatedEvent(canvas.getId(), tenantId, name, userId));
        return canvas;
    }

    @Transactional(readOnly = true)
    public Canvas getCanvas(String id) {
        Canvas canvas = canvasRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canvas not found: " + id));
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.equals(canvas.getTenantId())) {
            throw new AccessDeniedException("Canvas does not belong to the active tenant");
        }
        return canvas;
    }

    public CanvasNode addNode(String canvasId, String componentDefinitionId, double positionX, double positionY, String properties) {
        return addNode(canvasId, componentDefinitionId, positionX, positionY, properties, null);
    }

    public CanvasNode addNode(String canvasId, String componentDefinitionId, double positionX, double positionY, String properties, String nodeId) {
        Canvas canvas = getCanvas(canvasId);
        CanvasNode node = new CanvasNode(canvas, componentDefinitionId, positionX, positionY, properties, nodeId);
        canvas.addNode(node);
        canvas.incrementVersion();
        canvasRepository.save(canvas);
        eventPublisher.publishEvent(new ComponentAddedEvent(canvasId, node.getId(), componentDefinitionId, canvas.getTenantId()));
        return node;
    }

    public CanvasNode updateNode(String canvasId, String nodeId, String properties) {
        Canvas canvas = getCanvas(canvasId);
        CanvasNode node = canvas.getCanvasNodes().stream()
                .filter(n -> n.getId().equals(nodeId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Node not found: " + nodeId));
        node.setProperties(properties);
        canvas.incrementVersion();
        canvasRepository.save(canvas);
        return node;
    }

    public void removeNode(String canvasId, String nodeId) {
        Canvas canvas = getCanvas(canvasId);
        CanvasNode node = canvas.getCanvasNodes().stream()
                .filter(n -> n.getId().equals(nodeId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Node not found: " + nodeId));
        canvas.removeNode(node);
        canvas.incrementVersion();
        canvasRepository.save(canvas);
    }

    public CanvasEdge addEdge(String canvasId, String sourceNodeId, String targetNodeId, String type, String properties) {
        Canvas canvas = getCanvas(canvasId);
        CanvasEdge edge = new CanvasEdge(canvas, sourceNodeId, targetNodeId, type, properties);
        canvas.addEdge(edge);
        canvas.incrementVersion();
        canvasRepository.save(canvas);
        return edge;
    }

    public Canvas replaceContent(String canvasId,
                                 int expectedVersion,
                                 String name,
                                 String metadata,
                                 List<NodeSnapshot> nodes,
                                 List<EdgeSnapshot> edges) {
        Canvas canvas = getCanvas(canvasId);
        if (canvas.getDesignVersion() != expectedVersion) {
            throw new OptimisticLockingFailureException(
                    "O design foi alterado por outra sessão. Recarregue antes de salvar.");
        }

        Set<String> nodeIds = new HashSet<>();
        for (NodeSnapshot node : nodes) {
            if (!nodeIds.add(node.id())) {
                throw new IllegalArgumentException("ID de nó duplicado: " + node.id());
            }
        }
        Set<String> requestedEdgeIds = new HashSet<>();
        for (EdgeSnapshot edge : edges) {
            if (!requestedEdgeIds.add(edge.id())) {
                throw new IllegalArgumentException("ID de conexão duplicado: " + edge.id());
            }
            if (!nodeIds.contains(edge.sourceNodeId())
                    || !nodeIds.contains(edge.targetNodeId())) {
                throw new IllegalArgumentException(
                        "A conexão referencia um nó inexistente: " + edge.id());
            }
        }

        Map<String, CanvasEdge> existingEdges = canvas.getCanvasEdges().stream()
                .collect(Collectors.toMap(CanvasEdge::getId, Function.identity()));
        Map<String, CanvasNode> existingNodes = canvas.getCanvasNodes().stream()
                .collect(Collectors.toMap(CanvasNode::getId, Function.identity()));
        new ArrayList<>(canvas.getCanvasEdges()).stream()
                .filter(edge -> !requestedEdgeIds.contains(edge.getId()))
                .forEach(canvas::removeEdge);
        new ArrayList<>(canvas.getCanvasNodes()).stream()
                .filter(node -> !nodeIds.contains(node.getId()))
                .forEach(canvas::removeNode);

        for (NodeSnapshot node : nodes) {
            CanvasNode target = existingNodes.get(node.id());
            if (target == null) {
                canvas.addNode(new CanvasNode(
                        canvas,
                        node.componentDefinitionId(),
                        node.positionX(),
                        node.positionY(),
                        node.properties(),
                        node.id()));
            } else {
                target.setComponentDefinitionId(node.componentDefinitionId());
                target.setPositionX(node.positionX());
                target.setPositionY(node.positionY());
                target.setProperties(node.properties());
            }
        }
        for (EdgeSnapshot edge : edges) {
            CanvasEdge target = existingEdges.get(edge.id());
            if (target == null) {
                canvas.addEdge(new CanvasEdge(
                        canvas,
                        edge.sourceNodeId(),
                        edge.targetNodeId(),
                        edge.edgeType(),
                        edge.properties(),
                        edge.id()));
            } else {
                target.setSourceNodeId(edge.sourceNodeId());
                target.setTargetNodeId(edge.targetNodeId());
                target.setEdgeType(edge.edgeType());
                target.setProperties(edge.properties());
            }
        }
        canvas.setName(name);
        canvas.setMetadata(metadata);
        canvas.incrementVersion();
        Canvas saved = canvasRepository.save(canvas);
        eventPublisher.publishEvent(new CanvasContentReplacedEvent(
                saved.getId(),
                saved.getTenantId(),
                saved.getDesignVersion(),
                nodes.size(),
                edges.size(),
                Instant.now()));
        return saved;
    }

    public void deleteCanvas(String id) {
        Canvas canvas = getCanvas(id);
        canvasRepository.delete(canvas);
    }

    public record NodeSnapshot(
            String id,
            String componentDefinitionId,
            double positionX,
            double positionY,
            String properties
    ) {}

    public record EdgeSnapshot(
            String id,
            String sourceNodeId,
            String targetNodeId,
            String edgeType,
            String properties
    ) {}
}
