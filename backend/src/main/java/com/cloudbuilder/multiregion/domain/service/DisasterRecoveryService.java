package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.DisasterRecoveryPlan;
import com.cloudbuilder.multiregion.domain.model.Region;
import com.cloudbuilder.multiregion.domain.port.DisasterRecoveryPlanRepository;
import com.cloudbuilder.multiregion.domain.port.RegionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
@Service("multiRegionDisasterRecoveryService")
@Transactional
public class DisasterRecoveryService {

    private final DisasterRecoveryPlanRepository drPlanRepository;
    private final RegionRepository regionRepository;

    public DisasterRecoveryService(DisasterRecoveryPlanRepository drPlanRepository,
                                    RegionRepository regionRepository) {
        this.drPlanRepository = drPlanRepository;
        this.regionRepository = regionRepository;
    }

    public DisasterRecoveryPlan createPlan(String tenantId, String name, String description,
                                            String primaryRegionId, String drRegionId,
                                            String replicationStrategy, int rpoMinutes, int rtoMinutes) {
        Region primaryRegion = regionRepository.findById(primaryRegionId)
                .orElseThrow(() -> new IllegalArgumentException("Primary region not found: " + primaryRegionId));
        Region drRegion = regionRepository.findById(drRegionId)
                .orElseThrow(() -> new IllegalArgumentException("DR region not found: " + drRegionId));

        if (primaryRegionId.equals(drRegionId)) {
            throw new IllegalArgumentException("Primary and DR regions must be different");
        }

        // Validate replication strategy
        if (!List.of("SYNC", "ASYNC", "SNAPSHOT").contains(replicationStrategy)) {
            throw new IllegalArgumentException("Invalid replication strategy. Must be SYNC, ASYNC, or SNAPSHOT");
        }

        DisasterRecoveryPlan plan = new DisasterRecoveryPlan(
                tenantId, name, description, primaryRegion, drRegion,
                replicationStrategy, rpoMinutes, rtoMinutes
        );
        return drPlanRepository.save(plan);
    }

    public Optional<DisasterRecoveryPlan> getPlan(String id) {
        return drPlanRepository.findById(id);
    }

    public List<DisasterRecoveryPlan> getPlansByTenant(String tenantId) {
        return drPlanRepository.findByTenantId(tenantId);
    }

    public List<DisasterRecoveryPlan> getActivePlansByTenant(String tenantId) {
        return drPlanRepository.findByTenantIdAndStatus(tenantId, "ACTIVE");
    }

    public DisasterRecoveryPlan updatePlan(String id, String name, String description,
                                            String replicationStrategy, Integer rpoMinutes,
                                            Integer rtoMinutes, String failoverProcedure,
                                            String fallbackProcedure) {
        DisasterRecoveryPlan plan = drPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DR plan not found: " + id));

        if (name != null) plan.setName(name);
        if (description != null) plan.setDescription(description);
        if (replicationStrategy != null) {
            if (!List.of("SYNC", "ASYNC", "SNAPSHOT").contains(replicationStrategy)) {
                throw new IllegalArgumentException("Invalid replication strategy");
            }
            plan.setReplicationStrategy(replicationStrategy);
        }
        if (rpoMinutes != null) plan.setRpoMinutes(rpoMinutes);
        if (rtoMinutes != null) plan.setRtoMinutes(rtoMinutes);
        if (failoverProcedure != null) plan.setFailoverProcedure(failoverProcedure);
        if (fallbackProcedure != null) plan.setFallbackProcedure(fallbackProcedure);

        return drPlanRepository.save(plan);
    }

    public DisasterRecoveryPlan triggerFailover(String planId, String initiatedBy) {
        DisasterRecoveryPlan plan = drPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("DR plan not found: " + planId));

        if (!"ACTIVE".equals(plan.getStatus())) {
            throw new IllegalStateException("Plan is not active. Current status: " + plan.getStatus());
        }

        plan.setStatus("FAILOVER");
        plan.setLastFailoverAt(Instant.now());
        // In a real implementation, this would trigger actual failover logic
        // e.g., update DNS, promote DR database, scale up DR resources
        return drPlanRepository.save(plan);
    }

    public DisasterRecoveryPlan triggerFallback(String planId) {
        DisasterRecoveryPlan plan = drPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("DR plan not found: " + planId));

        if (!"FAILOVER".equals(plan.getStatus())) {
            throw new IllegalStateException("Plan is not in FAILOVER state. Current status: " + plan.getStatus());
        }

        plan.setStatus("ACTIVE");
        // In a real implementation, this would trigger fallback logic
        return drPlanRepository.save(plan);
    }

    public DisasterRecoveryPlan testPlan(String planId) {
        DisasterRecoveryPlan plan = drPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("DR plan not found: " + planId));

        plan.setStatus("TESTING");
        plan.setLastTestedAt(Instant.now());
        // In a real implementation, this would run DR test procedures
        return drPlanRepository.save(plan);
    }

    public void deletePlan(String id) {
        if (!drPlanRepository.existsById(id)) {
            throw new IllegalArgumentException("DR plan not found: " + id);
        }
        drPlanRepository.deleteById(id);
    }

    public List<DisasterRecoveryPlan> getPlansByRegion(String regionId) {
        return drPlanRepository.findByRegionId(regionId);
    }

    public List<DisasterRecoveryPlan> getPlansByStatus(String status) {
        return drPlanRepository.findByStatus(status);
    }
}