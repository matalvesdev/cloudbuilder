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

    /**
     * Computes a diff between two deploy plans.
     */
    public PlanDiff diff(String planIdA, String planIdB) {
        var planA = repository.findById(planIdA).orElse(null);
        var planB = repository.findById(planIdB).orElse(null);
        if (planA == null || planB == null) return null;

        int addedResources = planB.getAddCount() - planA.getAddCount();
        int changedResources = planB.getChangeCount() - planA.getChangeCount();
        int destroyedResources = planB.getDestroyCount() - planA.getDestroyCount();

        return new PlanDiff(
                planIdA, planIdB,
                addedResources, changedResources, destroyedResources,
                planA.getCreatedAt().toString(), planB.getCreatedAt().toString()
        );
    }

    public record PlanDiff(
            String planIdA, String planIdB,
            int addedResources, int changedResources, int destroyedResources,
            String timestampA, String timestampB
    ) {}

    /**
     * Returns deployment timeline (plans with applied status in chronological order).
     */
    public List<DeployPlan> getTimeline(String environmentId) {
        return repository.findByEnvironmentIdOrderByCreatedAtDesc(environmentId).stream()
                .filter(p -> "applied".equals(p.getStatus()) || "failed".equals(p.getStatus()))
                .toList();
    }
}
