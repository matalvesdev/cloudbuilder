package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.DeployPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeployPlanRepository extends JpaRepository<DeployPlan, String> {
    List<DeployPlan> findByEnvironmentIdOrderByCreatedAtDesc(String environmentId);
    List<DeployPlan> findByCanvasIdOrderByCreatedAtDesc(String canvasId);
    List<DeployPlan> findByStatusOrderByCreatedAtDesc(String status);
}
