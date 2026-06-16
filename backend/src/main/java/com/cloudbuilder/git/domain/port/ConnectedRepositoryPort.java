package com.cloudbuilder.git.domain.port;

import com.cloudbuilder.git.domain.model.ConnectedRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConnectedRepositoryPort {

    ConnectedRepository save(ConnectedRepository repository);

    Optional<ConnectedRepository> findById(UUID id);

    List<ConnectedRepository> findAll();

    void deleteById(UUID id);
}
