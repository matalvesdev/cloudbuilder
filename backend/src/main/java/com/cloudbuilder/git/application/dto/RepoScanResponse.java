package com.cloudbuilder.git.application.dto;

import com.cloudbuilder.git.domain.model.AppDetection;

import java.util.List;
import java.util.UUID;

public class RepoScanResponse {

    private UUID repoId;
    private List<String> files;
    private int resourceCount;
    private AppDetection appDetection;

    public RepoScanResponse() {
    }

    public RepoScanResponse(UUID repoId, List<String> files, int resourceCount, AppDetection appDetection) {
        this.repoId = repoId;
        this.files = files;
        this.resourceCount = resourceCount;
        this.appDetection = appDetection;
    }

    public UUID getRepoId() {
        return repoId;
    }

    public void setRepoId(UUID repoId) {
        this.repoId = repoId;
    }

    public List<String> getFiles() {
        return files;
    }

    public void setFiles(List<String> files) {
        this.files = files;
    }

    public int getResourceCount() {
        return resourceCount;
    }

    public void setResourceCount(int resourceCount) {
        this.resourceCount = resourceCount;
    }

    public AppDetection getAppDetection() {
        return appDetection;
    }

    public void setAppDetection(AppDetection appDetection) {
        this.appDetection = appDetection;
    }
}
