package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.domain.event.CanvasCreatedEvent;
import com.cloudbuilder.design.domain.event.ComponentAddedEvent;
import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

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
    public Canvas getCanvas(UUID id) {
        return canvasRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canvas not found: " + id));
    }

    public CanvasNode addNode(UUID canvasId, String componentDefinitionId, double positionX, double positionY, String properties) {
        Canvas canvas = getCanvas(canvasId);
        CanvasNode node = new CanvasNode(canvas, componentDefinitionId, positionX, positionY, properties);
        canvas.addNode(node);
        canvas.incrementVersion();
        canvasRepository.save(canvas);
        eventPublisher.publishEvent(new ComponentAddedEvent(canvasId, node.getId(), componentDefinitionId, canvas.getTenantId()));
        return node;
    }

    public CanvasNode updateNode(UUID canvasId, UUID nodeId, String properties) {
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

    public void removeNode(UUID canvasId, UUID nodeId) {
        Canvas canvas = getCanvas(canvasId);
        CanvasNode node = canvas.getCanvasNodes().stream()
                .filter(n -> n.getId().equals(nodeId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Node not found: " + nodeId));
        canvas.removeNode(node);
        canvas.incrementVersion();
        canvasRepository.save(canvas);
    }

    public CanvasEdge addEdge(UUID canvasId, UUID sourceNodeId, UUID targetNodeId, String type, String properties) {
        Canvas canvas = getCanvas(canvasId);
        CanvasEdge edge = new CanvasEdge(canvas, sourceNodeId, targetNodeId, type, properties);
        canvas.addEdge(edge);
        canvas.incrementVersion();
        canvasRepository.save(canvas);
        return edge;
    }

    public void deleteCanvas(UUID id) {
        Canvas canvas = getCanvas(id);
        canvasRepository.delete(canvas);
    }
}
