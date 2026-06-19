package com.cloudbuilder.git.domain.port;

import com.cloudbuilder.git.domain.model.ConnectedRepository;

import java.util.List;
import java.util.Optional;
public interface ConnectedRepositoryPort {

    ConnectedRepository save(ConnectedRepository repository);

    Optional<ConnectedRepository> findById(String id);

    List<ConnectedRepository> findAll();

    void deleteById(String id);
}
