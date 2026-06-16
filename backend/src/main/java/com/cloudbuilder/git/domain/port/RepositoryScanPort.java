package com.cloudbuilder.git.domain.port;

import com.cloudbuilder.git.domain.model.RepositoryScan;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RepositoryScanPort {

    RepositoryScan save(RepositoryScan scan);

    Optional<RepositoryScan> findById(UUID id);

    List<RepositoryScan> findByRepositoryId(UUID repositoryId);
}
