package com.cloudbuilder.git.application.dto;

import com.cloudbuilder.git.domain.model.PipelineRun;

import java.time.Instant;

/**
 * DTO for pipeline run visualization.
 * Used by GET /api/v1/git/pipelines/{repoId} to return CI/CD run status.
 */
public record PipelineRunDTO(
        String id,
        String pipelineName,
        String commitSha,
        String branch,
        String triggeredBy,
        String status,
        int durationSeconds,
        String stagesJson,
        String workflowRunUrl,
        Instant createdAt,
        Instant completedAt
) {
    public static PipelineRunDTO from(PipelineRun run) {
        return new PipelineRunDTO(
                run.getId(),
                run.getPipelineName(),
                run.getCommitSha(),
                run.getBranch(),
                run.getTriggeredBy(),
                run.getStatus().name(),
                run.getDurationSeconds(),
                run.getStagesJson(),
                run.getWorkflowRunUrl(),
                run.getCreatedAt(),
                run.getCompletedAt()
        );
    }
}
