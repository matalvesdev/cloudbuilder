package com.cloudbuilder.multiregion.domain.port;

import com.cloudbuilder.multiregion.domain.model.DRTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface DRTestResultRepository extends JpaRepository<DRTestResult, String> {

    List<DRTestResult> findByDrPlanIdOrderByTestedAtDesc(String drPlanId);

    List<DRTestResult> findByTenantIdOrderByTestedAtDesc(String tenantId);

    long countByDrPlanIdAndStatus(String drPlanId, String status);

    long countByDrPlanId(String drPlanId);
}
