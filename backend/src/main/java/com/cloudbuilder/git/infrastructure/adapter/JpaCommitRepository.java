package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.infrastructure.CommitEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA repository for CommitEntity.
 */
public interface JpaCommitRepository extends JpaRepository<CommitEntity, String> {

    List<CommitEntity> findByRepoIdOrderByTimestampDesc(String repoId);

    List<CommitEntity> findTop30ByRepoIdOrderByTimestampDesc(String repoId);

    List<CommitEntity> findByRepoIdAndSha(String repoId, String sha);
}
