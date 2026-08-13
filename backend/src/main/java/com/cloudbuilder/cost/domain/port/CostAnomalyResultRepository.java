package com.cloudbuilder.cost.domain.port;

import com.cloudbuilder.cost.domain.model.CostAnomalyResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CostAnomalyResultRepository extends JpaRepository<CostAnomalyResult, String> {
    List<CostAnomalyResult> findByEnvironmentIdOrderByDetectedAtDesc(String environmentId);
    List<CostAnomalyResult> findByEnvironmentIdAndAnomalyDateAfterOrderByAnomalyDateDesc(
            String environmentId, LocalDate since);
    List<CostAnomalyResult> findByEnvironmentIdAndServiceNameAndAnomalyDateBetween(
            String environmentId, String serviceName, LocalDate start, LocalDate end);
    List<CostAnomalyResult> findByStatus(String status);
}
