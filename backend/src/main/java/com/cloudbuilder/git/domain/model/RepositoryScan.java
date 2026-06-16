package com.cloudbuilder.git.domain.model;

import java.time.Instant;
import java.util.UUID;

public class RepositoryScan {

    public enum Status {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED
    }

    private UUID id;
    private UUID repositoryId;
    private Instant scannedAt;
    private String iacFiles;
    private AppDetection appDetection;
    private int resourceCount;
    private Status status;

    public RepositoryScan() {
    }

    public RepositoryScan(UUID repositoryId) {
        this.id = UUID.randomUUID();
        this.repositoryId = repositoryId;
        this.status = Status.PENDING;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRepositoryId() {
        return repositoryId;
    }

    public void setRepositoryId(UUID repositoryId) {
        this.repositoryId = repositoryId;
    }

    public Instant getScannedAt() {
        return scannedAt;
    }

    public void setScannedAt(Instant scannedAt) {
        this.scannedAt = scannedAt;
    }

    public String getIacFiles() {
        return iacFiles;
    }

    public void setIacFiles(String iacFiles) {
        this.iacFiles = iacFiles;
    }

    public AppDetection getAppDetection() {
        return appDetection;
    }

    public void setAppDetection(AppDetection appDetection) {
        this.appDetection = appDetection;
    }

    public int getResourceCount() {
        return resourceCount;
    }

    public void setResourceCount(int resourceCount) {
        this.resourceCount = resourceCount;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
