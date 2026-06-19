package com.cloudbuilder.cost.domain.port;

import com.cloudbuilder.cost.domain.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface BudgetRepository extends JpaRepository<Budget, String> {
    List<Budget> findByEnvironmentId(String environmentId);
    List<Budget> findByStatus(String status);
}
