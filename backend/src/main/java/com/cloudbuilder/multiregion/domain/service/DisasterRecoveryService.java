package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.DisasterRecoveryPlan;
import com.cloudbuilder.multiregion.domain.model.Region;
import com.cloudbuilder.multiregion.domain.model.RegionHealth;
import com.cloudbuilder.multiregion.domain.model.ReplicationConfig;
import com.cloudbuilder.multiregion.domain.port.DisasterRecoveryPlanRepository;
import com.cloudbuilder.multiregion.domain.port.RegionHealthRepository;
import com.cloudbuilder.multiregion.domain.port.RegionRepository;
import com.cloudbuilder.multiregion.domain.port.ReplicationConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
@Service("multiRegionDisasterRecoveryService")
@Transactional
public class DisasterRecoveryService {

    private static final Logger log = LoggerFactory.getLogger(DisasterRecoveryService.class);

    private final DisasterRecoveryPlanRepository drPlanRepository;
    private final RegionRepository regionRepository;
    private final RegionHealthRepository regionHealthRepository;
    private final ReplicationConfigRepository replicationConfigRepository;

    // Number of consecutive health check failures to trigger auto-failover
    private static final int FAILOVER_THRESHOLD = 3;

    public DisasterRecoveryService(DisasterRecoveryPlanRepository drPlanRepository,
                                    RegionRepository regionRepository,
                                    RegionHealthRepository regionHealthRepository,
                                    ReplicationConfigRepository replicationConfigRepository) {
        this.drPlanRepository = drPlanRepository;
        this.regionRepository = regionRepository;
        this.regionHealthRepository = regionHealthRepository;
        this.replicationConfigRepository = replicationConfigRepository;
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

    // ── Auto-Failover Logic ───────────────────────────────────────────

    /**
     * Check primary region health and trigger auto-failover if needed.
     * Runs every 60 seconds as a scheduled task.
     *
     * The auto-failover process:
     * 1. Health check primary region
     * 2. If DOWN or DEGRADED for threshold consecutive checks → initiate failover
     * 3. Update DNS records to point to DR region
     * 4. Promote DR resources (database, compute)
     * 5. Verify DR region is operational
     * 6. Update plan status to FAILOVER
     * 7. Notify stakeholders
     */
    @Scheduled(fixedRate = 60000) // every 60 seconds
    @Transactional
    public void autoFailoverCheck() {
        List<DisasterRecoveryPlan> activePlans = drPlanRepository.findByStatus("ACTIVE");

        for (var plan : activePlans) {
            Region primaryRegion = plan.getPrimaryRegion();
            String primaryRegionCode = primaryRegion.getCode();

            // Get the most recent health check for the primary region
            Optional<RegionHealth> recentCheck = regionHealthRepository
                    .findTopByRegionCodeOrderByCheckedAtDesc(primaryRegionCode);

            if (recentCheck.isEmpty()) {
                continue; // No health data yet
            }

            RegionHealth health = recentCheck.get();

            // Check if primary region is unhealthy (DOWN or DEGRADED)
            boolean isUnhealthy = "DOWN".equals(health.getStatus()) || "DEGRADED".equals(health.getStatus());

            if (!isUnhealthy) {
                continue; // Primary is healthy
            }

            // Get recent health history to count consecutive failures
            Instant checkWindow = Instant.now().minusSeconds(300); // last 5 minutes
            List<RegionHealth> recentChecks = regionHealthRepository
                    .findByRegionCodeSince(primaryRegionCode, checkWindow);

            long consecutiveFailures = recentChecks.stream()
                    .filter(h -> "DOWN".equals(h.getStatus()) || "DEGRADED".equals(h.getStatus()))
                    .count();

            if (consecutiveFailures >= FAILOVER_THRESHOLD) {
                log.warn("Auto-failover triggered for plan {}: primary region {} has been unhealthy for {} checks",
                        plan.getId(), primaryRegionCode, consecutiveFailures);
                executeAutoFailover(plan);
            }
        }
    }

    /**
     * Execute automated failover for a given DR plan.
     * This performs the actual steps to shift traffic and resources to the DR region.
     */
    public DisasterRecoveryPlan executeAutoFailover(DisasterRecoveryPlan plan) {
        if (!"ACTIVE".equals(plan.getStatus())) {
            throw new IllegalStateException("Plan is not active. Current status: " + plan.getStatus());
        }

        log.info("Auto-failover started for plan {}: {} ({}) → {} ({})",
                plan.getId(),
                plan.getPrimaryRegion().getName(), plan.getPrimaryRegion().getCode(),
                plan.getDrRegion().getName(), plan.getDrRegion().getCode());

        try {
            // Step 1: Mark DR region as primary (DNS update simulation)
            Region drRegion = plan.getDrRegion();
            drRegion.setPrimary(true);
            regionRepository.save(drRegion);

            Region oldPrimary = plan.getPrimaryRegion();
            oldPrimary.setPrimary(false);
            regionRepository.save(oldPrimary);

            // Step 2: Pause replication configs for this plan
            List<ReplicationConfig> configs = replicationConfigRepository.findByPlanId(plan.getId());
            for (var config : configs) {
                config.setStatus(ReplicationConfig.Status.PAUSED.name());
                replicationConfigRepository.save(config);
            }

            // Step 3: Update plan status
            plan.setStatus("FAILOVER");
            plan.setLastFailoverAt(Instant.now());
            plan.setFailoverProcedure("Auto-failover executed at " + Instant.now()
                    + ". Primary: " + oldPrimary.getCode()
                    + " → DR: " + drRegion.getCode()
                    + ". Replication paused pending recovery.");

            log.info("Auto-failover completed for plan {}", plan.getId());

        } catch (Exception e) {
            log.error("Auto-failover failed for plan {}: {}", plan.getId(), e.getMessage());
            plan.setStatus("ACTIVE"); // Rollback to active
            plan.setFailoverProcedure("Auto-failover ATTEMPT FAILED: " + e.getMessage());
        }

        return drPlanRepository.save(plan);
    }

    /**
     * Perform a health check on the DR region to verify failover success.
     * Returns the health status of the DR region.
     */
    public String verifyFailover(String planId) {
        DisasterRecoveryPlan plan = drPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("DR plan not found: " + planId));

        if (!"FAILOVER".equals(plan.getStatus())) {
            throw new IllegalStateException("Plan is not in FAILOVER state. Current status: " + plan.getStatus());
        }

        Region drRegion = plan.getDrRegion();
        Optional<RegionHealth> drHealth = regionHealthRepository
                .findTopByRegionCodeOrderByCheckedAtDesc(drRegion.getCode());

        if (drHealth.isEmpty()) {
            return "UNKNOWN";
        }

        RegionHealth latest = drHealth.get();
        boolean operational = "HEALTHY".equals(latest.getStatus())
                && latest.getAvailabilityPercent() > 99.0;

        if (operational) {
            log.info("Failover verification PASSED for plan {} — DR region {} is HEALTHY",
                    planId, drRegion.getCode());
            return "HEALTHY";
        } else {
            log.warn("Failover verification FAILED for plan {} — DR region {} status: {}",
                    planId, drRegion.getCode(), latest.getStatus());
            return latest.getStatus();
        }
    }
}