package com.cloudbuilder.cost.domain.port;

import com.cloudbuilder.cost.domain.model.BudgetAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetAlertRepository extends JpaRepository<BudgetAlert, String> {

    List<BudgetAlert> findByTenantId(String tenantId);

    List<BudgetAlert> findByTenantIdAndStatus(String tenantId, String status);

    List<BudgetAlert> findByTenantIdAndPeriod(String tenantId, String period);
}
