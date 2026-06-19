package com.cloudbuilder.git.domain.port;

import com.cloudbuilder.git.domain.model.RepositoryScan;

import java.util.List;
import java.util.Optional;
public interface RepositoryScanPort {

    RepositoryScan save(RepositoryScan scan);

    Optional<RepositoryScan> findById(String id);

    List<RepositoryScan> findByRepositoryId(String repositoryId);
}
