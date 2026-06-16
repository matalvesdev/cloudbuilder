package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.EphemeralEnvironment;
import com.cloudbuilder.provision.domain.port.EphemeralEnvironmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class EphemeralEnvironmentService {

    private final EphemeralEnvironmentRepository repository;

    public EphemeralEnvironmentService(EphemeralEnvironmentRepository repository) {
        this.repository = repository;
    }

    public EphemeralEnvironment create(String tenantId, String projectId, String name,
                                        String repoId, String branchName, UUID sourceEnvironmentId,
                                        int ttlHours, String resourceSize) {
        EphemeralEnvironment env = new EphemeralEnvironment(
                tenantId, projectId, name, repoId, branchName,
                sourceEnvironmentId, ttlHours, resourceSize);
        return repository.save(env);
    }

    public List<EphemeralEnvironment> getByTenant(String tenantId) {
        return repository.findByTenantId(tenantId);
    }

    public List<EphemeralEnvironment> getByProject(String projectId) {
        return repository.findByProjectId(projectId);
    }

    public Optional<EphemeralEnvironment> getById(UUID id) {
        return repository.findById(id);
    }

    public EphemeralEnvironment destroy(UUID id) {
        EphemeralEnvironment env = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ephemeral environment not found: " + id));
        env.markDestroying();
        repository.save(env);
        return env;
    }

    public EphemeralEnvironment completeDestroy(UUID id) {
        EphemeralEnvironment env = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ephemeral environment not found: " + id));
        env.markDestroyed();
        return repository.save(env);
    }

    public EphemeralEnvironment extendTtl(UUID id, int extraHours) {
        EphemeralEnvironment env = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ephemeral environment not found: " + id));
        if (!"ACTIVE".equals(env.getStatus())) {
            throw new IllegalStateException("Cannot extend TTL for environment with status: " + env.getStatus());
        }
        env.extendTtl(extraHours);
        return repository.save(env);
    }

    public EphemeralEnvironment activate(UUID id, String baseUrl) {
        EphemeralEnvironment env = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ephemeral environment not found: " + id));
        env.markActive(baseUrl);
        return repository.save(env);
    }

    public List<EphemeralEnvironment> getExpiredEnvironments() {
        return repository.findByStatusAndExpiresAtBefore("ACTIVE", Instant.now());
    }

    public long getActiveCount(String tenantId) {
        return repository.countByTenantIdAndStatusIn(tenantId, List.of("CREATING", "ACTIVE"));
    }

    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
