package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.infrastructure.GitScanResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface JpaGitScanResult extends JpaRepository<GitScanResultEntity, String> {

    List<GitScanResultEntity> findByRepositoryId(String repositoryId);
}
