package com.cloudbuilder.git.domain.port;

import com.cloudbuilder.git.domain.model.Commit;

import java.util.List;
import java.util.Optional;

/**
 * Repository port for Commit entity persistence.
 * Implemented by Spring Data JPA in the infrastructure layer.
 */
public interface CommitRepository {

    Commit save(Commit commit);

    Optional<Commit> findById(String id);

    List<Commit> findByRepoIdOrderByTimestampDesc(String repoId);

    List<Commit> findByRepoIdAndSha(String repoId, String sha);

    List<Commit> findByRepoIdOrderByTimestampDesc(String repoId, int limit);

    void deleteById(String id);
}
