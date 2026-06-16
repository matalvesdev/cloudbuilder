package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.infrastructure.GitScanResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JpaGitScanResult extends JpaRepository<GitScanResultEntity, UUID> {

    List<GitScanResultEntity> findByRepositoryId(UUID repositoryId);
}
