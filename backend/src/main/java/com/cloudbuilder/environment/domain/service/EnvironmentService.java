package com.cloudbuilder.environment.domain.service;

import com.cloudbuilder.environment.domain.model.ManagedEnvironment;
import com.cloudbuilder.environment.domain.model.ManagedEnvironment.Status;
import com.cloudbuilder.environment.domain.port.EnvironmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class EnvironmentService {

    private final EnvironmentRepository environmentRepository;

    public EnvironmentService(EnvironmentRepository environmentRepository) {
        this.environmentRepository = environmentRepository;
    }

    public ManagedEnvironment create(ManagedEnvironment environment) {
        return environmentRepository.save(environment);
    }

    @Transactional(readOnly = true)
    public List<ManagedEnvironment> findByTenantId(String tenantId) {
        return environmentRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<ManagedEnvironment> findById(String id) {
        return environmentRepository.findById(id);
    }

    public Optional<ManagedEnvironment> update(String id, String name, String description,
                                                String provider, String region,
                                                String credentialsId, String configJson,
                                                Status status) {
        return environmentRepository.findById(id).map(env -> {
            env.setName(name);
            env.setDescription(description);
            env.setProvider(provider);
            env.setRegion(region);
            env.setCredentialsId(credentialsId);
            env.setConfigJson(configJson);
            env.setStatus(status);
            env.setUpdatedAt(Instant.now());
            return environmentRepository.save(env);
        });
    }

    public void delete(String id) {
        environmentRepository.deleteById(id);
    }
}
