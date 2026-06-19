package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.infrastructure.GitRepositoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaGitRepository extends JpaRepository<GitRepositoryEntity, String> {
}
