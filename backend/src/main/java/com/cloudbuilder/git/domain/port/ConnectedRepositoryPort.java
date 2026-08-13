package com.cloudbuilder.git.domain.port;

import com.cloudbuilder.git.domain.model.ConnectedRepository;

import java.util.List;
import java.util.Optional;
public interface ConnectedRepositoryPort {

    ConnectedRepository save(ConnectedRepository repository);

    Optional<ConnectedRepository> findById(String id);

    Optional<ConnectedRepository> findByFullName(String fullName);

    List<ConnectedRepository> findAll();

    void deleteById(String id);
}
