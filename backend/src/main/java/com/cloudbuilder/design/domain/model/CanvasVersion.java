package com.cloudbuilder.design.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "canvas_versions")
public class CanvasVersion {

    @Id
    private UUID id;

    @Column(name = "canvas_id", nullable = false)
    private UUID canvasId;

    @Column(nullable = false)
    private int version;

    @Column(columnDefinition = "TEXT")
    private String snapshot;

    private String changeDescription;

    private String createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canvas_id", insertable = false, updatable = false)
    private Canvas canvas;

    protected CanvasVersion() {}

    public CanvasVersion(UUID id, UUID canvasId, int version, String snapshot, String changeDescription, String createdBy, Instant createdAt) {
        this.id = id;
        this.canvasId = canvasId;
        this.version = version;
        this.snapshot = snapshot;
        this.changeDescription = changeDescription;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public CanvasVersion(UUID canvasId, int version, String snapshot, String changeDescription, String createdBy) {
        this.id = UUID.randomUUID();
        this.canvasId = canvasId;
        this.version = version;
        this.snapshot = snapshot;
        this.changeDescription = changeDescription;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getCanvasId() { return canvasId; }
    public int getVersion() { return version; }
    public String getSnapshot() { return snapshot; }
    public String getChangeDescription() { return changeDescription; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Canvas getCanvas() { return canvas; }

    public void setId(UUID id) { this.id = id; }
    public void setCanvasId(UUID canvasId) { this.canvasId = canvasId; }
    public void setVersion(int version) { this.version = version; }
    public void setSnapshot(String snapshot) { this.snapshot = snapshot; }
    public void setChangeDescription(String changeDescription) { this.changeDescription = changeDescription; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
