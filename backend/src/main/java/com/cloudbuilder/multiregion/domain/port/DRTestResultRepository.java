package com.cloudbuilder.multiregion.domain.port;

import com.cloudbuilder.multiregion.domain.model.DRTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DRTestResultRepository extends JpaRepository<DRTestResult, UUID> {

    List<DRTestResult> findByDrPlanIdOrderByTestedAtDesc(UUID drPlanId);

    List<DRTestResult> findByTenantIdOrderByTestedAtDesc(String tenantId);

    long countByDrPlanIdAndStatus(UUID drPlanId, String status);

    long countByDrPlanId(UUID drPlanId);
}
