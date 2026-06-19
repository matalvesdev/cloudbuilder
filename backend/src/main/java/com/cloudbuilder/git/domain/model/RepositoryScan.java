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

    private String id;
    private String repositoryId;
    private Instant scannedAt;
    private String iacFiles;
    private AppDetection appDetection;
    private int resourceCount;
    private Status status;

    public RepositoryScan() {
    }

    public RepositoryScan(String repositoryId) {
        this.id = UUID.randomUUID().toString();
        this.repositoryId = repositoryId;
        this.status = Status.PENDING;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRepositoryId() {
        return repositoryId;
    }

    public void setRepositoryId(String repositoryId) {
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
