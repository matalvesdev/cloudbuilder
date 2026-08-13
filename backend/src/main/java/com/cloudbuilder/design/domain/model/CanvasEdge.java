package com.cloudbuilder.design.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "canvas_edges")
public class CanvasEdge {

    @Id
    private String id;

    @JsonBackReference("canvas-edges")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canvas_id", nullable = false)
    private Canvas canvas;

    @Column(name = "source_node_id", nullable = false)
    private String sourceNodeId;

    @Column(name = "target_node_id", nullable = false)
    private String targetNodeId;

    @Column(name = "edge_type", nullable = false)
    private String edgeType;

    @Column(columnDefinition = "TEXT")
    private String properties;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected CanvasEdge() {}

    public CanvasEdge(Canvas canvas, String sourceNodeId, String targetNodeId, String edgeType, String properties) {
        this(canvas, sourceNodeId, targetNodeId, edgeType, properties, null);
    }

    public CanvasEdge(Canvas canvas, String sourceNodeId, String targetNodeId,
                      String edgeType, String properties, String id) {
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.canvas = canvas;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.edgeType = edgeType;
        this.properties = properties;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public Canvas getCanvas() { return canvas; }
    public void setCanvas(Canvas canvas) { this.canvas = canvas; }
    public String getSourceNodeId() { return sourceNodeId; }
    public void setSourceNodeId(String sourceNodeId) { this.sourceNodeId = sourceNodeId; }
    public String getTargetNodeId() { return targetNodeId; }
    public void setTargetNodeId(String targetNodeId) { this.targetNodeId = targetNodeId; }
    public String getEdgeType() { return edgeType; }
    public void setEdgeType(String edgeType) { this.edgeType = edgeType; }
    public String getProperties() { return properties; }
    public void setProperties(String properties) { this.properties = properties; }
    public Instant getCreatedAt() { return createdAt; }
}
