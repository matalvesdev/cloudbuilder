package com.cloudbuilder.git.infrastructure;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "git_pipeline_runs")
public class PipelineRunEntity {

    @Id
    private String id;

    @Column(name = "repository_id", nullable = false)
    private String repositoryId;

    @Column(name = "pipeline_name", nullable = false)
    private String pipelineName;

    @Column(name = "commit_sha")
    private String commitSha;

    private String branch;

    @Column(name = "triggered_by")
    private String triggeredBy;

    @Column(nullable = false)
    private String status;

    @Column(name = "duration_seconds")
    private int durationSeconds;

    @Column(name = "stages_json", columnDefinition = "TEXT")
    private String stagesJson;

    @Column(name = "workflow_run_url", columnDefinition = "TEXT")
    private String workflowRunUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAtTimestamp;

    @Column(nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    protected PipelineRunEntity() {}

    public PipelineRunEntity(String id, String repositoryId, String pipelineName,
                              String commitSha, String branch, String triggeredBy,
                              String status) {
        this.id = id;
        this.repositoryId = repositoryId;
        this.pipelineName = pipelineName;
        this.commitSha = commitSha;
        this.branch = branch;
        this.triggeredBy = triggeredBy;
        this.status = status;
        this.createdAt = Instant.now();
        this.createdAtTimestamp = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
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
    public Instant getCreatedAtTimestamp() { return createdAtTimestamp; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Long getVersion() { return version; }
}
