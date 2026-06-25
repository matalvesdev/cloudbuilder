package com.cloudbuilder.cost.domain.port;

import com.cloudbuilder.cost.domain.model.CostOptimizationSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CostOptimizationRepository extends JpaRepository<CostOptimizationSuggestion, String> {
    List<CostOptimizationSuggestion> findByEnvironmentId(String environmentId);
    List<CostOptimizationSuggestion> findByEnvironmentIdAndAppliedFalse(String environmentId);
    List<CostOptimizationSuggestion> findByEnvironmentIdAndResourceId(String environmentId, String resourceId);
    List<CostOptimizationSuggestion> findByTenantId(String tenantId);
}
