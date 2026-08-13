package com.cloudbuilder.design.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "canvas_nodes")
public class CanvasNode {

    @Id
    private String id;

    @JsonBackReference("canvas-nodes")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canvas_id", nullable = false)
    private Canvas canvas;

    @Column(name = "component_definition_id", nullable = false)
    private String componentDefinitionId;

    @Column(name = "position_x", nullable = false)
    private double positionX;

    @Column(name = "position_y", nullable = false)
    private double positionY;

    @Column(columnDefinition = "TEXT")
    private String properties;

    @Column(name = "validation_status")
    private String validationStatus;

    @Column(name = "validation_details", columnDefinition = "TEXT")
    private String validationDetails;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected CanvasNode() {}

    public CanvasNode(Canvas canvas, String componentDefinitionId, double positionX, double positionY, String properties) {
        this(canvas, componentDefinitionId, positionX, positionY, properties, null);
    }

    public CanvasNode(Canvas canvas, String componentDefinitionId, double positionX, double positionY, String properties, String id) {
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.canvas = canvas;
        this.componentDefinitionId = componentDefinitionId;
        this.positionX = positionX;
        this.positionY = positionY;
        this.properties = properties;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public Canvas getCanvas() { return canvas; }
    public void setCanvas(Canvas canvas) { this.canvas = canvas; }
    public String getComponentDefinitionId() { return componentDefinitionId; }
    public void setComponentDefinitionId(String componentDefinitionId) { this.componentDefinitionId = componentDefinitionId; }
    public double getPositionX() { return positionX; }
    public void setPositionX(double positionX) { this.positionX = positionX; }
    public double getPositionY() { return positionY; }
    public void setPositionY(double positionY) { this.positionY = positionY; }
    public String getProperties() { return properties; }
    public void setProperties(String properties) { this.properties = properties; }
    public String getValidationStatus() { return validationStatus; }
    public void setValidationStatus(String validationStatus) { this.validationStatus = validationStatus; }
    public String getValidationDetails() { return validationDetails; }
    public void setValidationDetails(String validationDetails) { this.validationDetails = validationDetails; }
    public Instant getCreatedAt() { return createdAt; }
}
