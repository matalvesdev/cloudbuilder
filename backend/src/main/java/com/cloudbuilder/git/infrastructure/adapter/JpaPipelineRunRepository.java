package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.infrastructure.PipelineRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JpaPipelineRunRepository extends JpaRepository<PipelineRunEntity, String> {
    List<PipelineRunEntity> findByRepositoryIdOrderByCreatedAtDesc(String repositoryId);
}
