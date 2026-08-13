package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.infrastructure.GitRepositoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JpaGitRepository extends JpaRepository<GitRepositoryEntity, String> {
    Optional<GitRepositoryEntity> findByFullName(String fullName);
}
