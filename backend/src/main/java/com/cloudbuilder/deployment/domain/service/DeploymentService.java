package com.cloudbuilder.deployment.domain.service;

import com.cloudbuilder.deployment.domain.model.Deployment;
import com.cloudbuilder.deployment.domain.port.DeploymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DeploymentService {

    private final DeploymentRepository deploymentRepository;

    public DeploymentService(DeploymentRepository deploymentRepository) {
        this.deploymentRepository = deploymentRepository;
    }

    public Deployment create(Deployment deployment) {
        var saved = deploymentRepository.save(deployment);
        saved.setStatus(Deployment.Status.PENDING);
        saved.setStartedAt(Instant.now());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Deployment> findByEnvironmentId(String environmentId) {
        return deploymentRepository.findByEnvironmentIdOrderByStartedAtDesc(environmentId);
    }

    @Transactional(readOnly = true)
    public Optional<Deployment> findById(String id) {
        return deploymentRepository.findById(id);
    }

    public Optional<Deployment> rollback(String id) {
        return deploymentRepository.findById(id).map(deployment -> {
            deployment.setStatus(Deployment.Status.ROLLED_BACK);
            deployment.setCompletedAt(Instant.now());
            return deploymentRepository.save(deployment);
        });
    }
}
