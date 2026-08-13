package com.cloudbuilder.design.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "canvases")
public class Canvas extends AggregateRoot {

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "design_version", nullable = false)
    private int designVersion;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @JsonManagedReference("canvas-nodes")
    @OneToMany(mappedBy = "canvas", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CanvasNode> canvasNodes = new ArrayList<>();

    @JsonManagedReference("canvas-edges")
    @OneToMany(mappedBy = "canvas", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CanvasEdge> canvasEdges = new ArrayList<>();

    protected Canvas() {}

    public Canvas(String tenantId, String name, String description, String createdBy) {
        this.tenantId = tenantId;
        this.name = name;
        this.description = description;
        this.designVersion = 1;
        this.createdBy = createdBy;
    }

    public void addNode(CanvasNode node) {
        canvasNodes.add(node);
        node.setCanvas(this);
    }

    public void removeNode(CanvasNode node) {
        canvasNodes.remove(node);
        node.setCanvas(null);
    }

    public void addEdge(CanvasEdge edge) {
        canvasEdges.add(edge);
        edge.setCanvas(this);
    }

    public void removeEdge(CanvasEdge edge) {
        canvasEdges.remove(edge);
        edge.setCanvas(null);
    }

    public void incrementVersion() {
        this.designVersion++;
    }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getDesignVersion() { return designVersion; }
    public void setDesignVersion(int designVersion) { this.designVersion = designVersion; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public List<CanvasNode> getCanvasNodes() { return canvasNodes; }
    public List<CanvasEdge> getCanvasEdges() { return canvasEdges; }
}
