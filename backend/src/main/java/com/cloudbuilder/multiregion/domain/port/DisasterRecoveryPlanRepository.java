package com.cloudbuilder.multiregion.domain.port;

import com.cloudbuilder.multiregion.domain.model.DisasterRecoveryPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface DisasterRecoveryPlanRepository extends JpaRepository<DisasterRecoveryPlan, String> {

    List<DisasterRecoveryPlan> findByTenantId(String tenantId);

    List<DisasterRecoveryPlan> findByTenantIdAndStatus(String tenantId, String status);

    Optional<DisasterRecoveryPlan> findByTenantIdAndPrimaryRegion_CodeAndDrRegion_Code(
            String tenantId, String primaryRegionCode, String drRegionCode);

    @Query("SELECT d FROM DisasterRecoveryPlan d WHERE d.primaryRegion.id = :regionId OR d.drRegion.id = :regionId")
    List<DisasterRecoveryPlan> findByRegionId(@Param("regionId") String regionId);

    List<DisasterRecoveryPlan> findByStatus(String status);
}