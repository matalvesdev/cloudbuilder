package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.domain.model.PipelineRun;
import com.cloudbuilder.git.domain.port.PipelineRunPort;
import com.cloudbuilder.git.infrastructure.PipelineRunEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class PipelineRunJpaAdapter implements PipelineRunPort {

    private final JpaPipelineRunRepository springRepo;

    public PipelineRunJpaAdapter(JpaPipelineRunRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public PipelineRun save(PipelineRun run) {
        PipelineRunEntity entity = toEntity(run);
        PipelineRunEntity saved = springRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<PipelineRun> findById(String id) {
        return springRepo.findById(id).map(this::toDomain);
    }

    @Override
    public List<PipelineRun> findByRepositoryId(String repositoryId) {
        return springRepo.findByRepositoryIdOrderByCreatedAtDesc(repositoryId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<PipelineRun> findByRepositoryIdOrderByCreatedAtDesc(String repositoryId) {
        return springRepo.findByRepositoryIdOrderByCreatedAtDesc(repositoryId).stream()
                .map(this::toDomain)
                .toList();
    }

    private PipelineRunEntity toEntity(PipelineRun domain) {
        PipelineRunEntity entity = new PipelineRunEntity(
                domain.getId(),
                domain.getRepositoryId(),
                domain.getPipelineName(),
                domain.getCommitSha(),
                domain.getBranch(),
                domain.getTriggeredBy(),
                domain.getStatus().name()
        );
        entity.setDurationSeconds(domain.getDurationSeconds());
        entity.setStagesJson(domain.getStagesJson());
        entity.setWorkflowRunUrl(domain.getWorkflowRunUrl());
        if (domain.getCompletedAt() != null) {
            entity.setCompletedAt(domain.getCompletedAt());
        }
        if (domain.getCreatedAt() != null) {
            entity.setCreatedAt(domain.getCreatedAt());
        }
        return entity;
    }

    private PipelineRun toDomain(PipelineRunEntity entity) {
        PipelineRun domain = new PipelineRun();
        domain.setId(entity.getId());
        domain.setRepositoryId(entity.getRepositoryId());
        domain.setPipelineName(entity.getPipelineName());
        domain.setCommitSha(entity.getCommitSha());
        domain.setBranch(entity.getBranch());
        domain.setTriggeredBy(entity.getTriggeredBy());
        domain.setStatus(PipelineRun.Status.valueOf(entity.getStatus()));
        domain.setDurationSeconds(entity.getDurationSeconds());
        domain.setStagesJson(entity.getStagesJson());
        domain.setWorkflowRunUrl(entity.getWorkflowRunUrl());
        domain.setCreatedAt(entity.getCreatedAt());
        domain.setCompletedAt(entity.getCompletedAt());
        return domain;
    }
}
