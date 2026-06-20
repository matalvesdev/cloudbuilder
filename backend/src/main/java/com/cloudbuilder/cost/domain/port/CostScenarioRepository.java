package com.cloudbuilder.cost.domain.port;

import com.cloudbuilder.cost.domain.model.CostScenario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CostScenarioRepository extends JpaRepository<CostScenario, String> {
    List<CostScenario> findByEnvironmentIdOrderByCreatedAtDesc(String environmentId);
    List<CostScenario> findByCanvasIdOrderByCreatedAtDesc(String canvasId);
    List<CostScenario> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
