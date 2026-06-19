package com.cloudbuilder.git.application.dto;

import com.cloudbuilder.git.domain.model.AppDetection;

import java.util.List;
public class RepoScanResponse {

    private String repoId;
    private List<String> files;
    private int resourceCount;
    private AppDetection appDetection;

    public RepoScanResponse() {
    }

    public RepoScanResponse(String repoId, List<String> files, int resourceCount, AppDetection appDetection) {
        this.repoId = repoId;
        this.files = files;
        this.resourceCount = resourceCount;
        this.appDetection = appDetection;
    }

    public String getRepoId() {
        return repoId;
    }

    public void setRepoId(String repoId) {
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
