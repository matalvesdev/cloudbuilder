package com.cloudbuilder.git.domain.port;

import com.cloudbuilder.git.domain.model.PipelineRun;

import java.util.List;
import java.util.Optional;

public interface PipelineRunPort {

    PipelineRun save(PipelineRun run);

    Optional<PipelineRun> findById(String id);

    List<PipelineRun> findByRepositoryId(String repositoryId);

    List<PipelineRun> findByRepositoryIdOrderByCreatedAtDesc(String repositoryId);
}
