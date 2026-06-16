package com.cloudbuilder.cost.domain.port;

import com.cloudbuilder.cost.domain.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    List<Budget> findByEnvironmentId(String environmentId);
    List<Budget> findByStatus(String status);
}
