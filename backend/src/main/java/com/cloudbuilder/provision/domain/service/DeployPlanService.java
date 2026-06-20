package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.DeployPlan;
import com.cloudbuilder.provision.domain.port.DeployPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class DeployPlanService {

    private final DeployPlanRepository repository;

    public DeployPlanService(DeployPlanRepository repository) {
        this.repository = repository;
    }

    public DeployPlan create(DeployPlan plan) {
        return repository.save(plan);
    }

    @Transactional(readOnly = true)
    public DeployPlan findById(String id) {
        return repository.findById(id).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<DeployPlan> findByEnvironment(String environmentId) {
        return repository.findByEnvironmentIdOrderByCreatedAtDesc(environmentId);
    }

    @Transactional(readOnly = true)
    public List<DeployPlan> findByCanvas(String canvasId) {
        return repository.findByCanvasIdOrderByCreatedAtDesc(canvasId);
    }

    public DeployPlan markApplied(String id) {
        var plan = repository.findById(id).orElse(null);
        if (plan != null) {
            plan.setStatus("applied");
            plan.setAppliedAt(Instant.now());
            return repository.save(plan);
        }
        return null;
    }

    public DeployPlan markFailed(String id) {
        var plan = repository.findById(id).orElse(null);
        if (plan != null) {
            plan.setStatus("failed");
            return repository.save(plan);
        }
        return null;
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
