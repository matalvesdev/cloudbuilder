package com.cloudbuilder.git.domain.model;

import java.time.Instant;
import java.util.UUID;

public class PipelineRun {

    public enum Status {
        PENDING,
        RUNNING,
        SUCCESS,
        FAILED,
        CANCELLED,
        SKIPPED
    }

    private String id;
    private String repositoryId;
    private String pipelineName;
    private String commitSha;
    private String branch;
    private String triggeredBy;
    private Status status;
    private int durationSeconds;
    private String stagesJson;
    private String workflowRunUrl;
    private Instant createdAt;
    private Instant completedAt;

    public PipelineRun() {}

    public PipelineRun(String repositoryId, String pipelineName, String commitSha,
                       String branch, String triggeredBy) {
        this.id = UUID.randomUUID().toString();
        this.repositoryId = repositoryId;
        this.pipelineName = pipelineName;
        this.commitSha = commitSha;
        this.branch = branch;
        this.triggeredBy = triggeredBy;
        this.status = Status.PENDING;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRepositoryId() { return repositoryId; }
    public void setRepositoryId(String repositoryId) { this.repositoryId = repositoryId; }

    public String getPipelineName() { return pipelineName; }
    public void setPipelineName(String pipelineName) { this.pipelineName = pipelineName; }

    public String getCommitSha() { return commitSha; }
    public void setCommitSha(String commitSha) { this.commitSha = commitSha; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(String triggeredBy) { this.triggeredBy = triggeredBy; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }

    public String getStagesJson() { return stagesJson; }
    public void setStagesJson(String stagesJson) { this.stagesJson = stagesJson; }

    public String getWorkflowRunUrl() { return workflowRunUrl; }
    public void setWorkflowRunUrl(String workflowRunUrl) { this.workflowRunUrl = workflowRunUrl; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
