package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.DrillConfig;
import com.cloudbuilder.provision.domain.model.FailoverGroup;
import com.cloudbuilder.provision.domain.model.RegionDeployment;
import com.cloudbuilder.provision.domain.port.DrillConfigRepository;
import com.cloudbuilder.provision.domain.port.FailoverGroupRepository;
import com.cloudbuilder.provision.domain.port.RegionDeploymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class DisasterRecoveryService {

    private final RegionDeploymentRepository regionDeploymentRepository;
    private final FailoverGroupRepository failoverGroupRepository;
    private final DrillConfigRepository drillConfigRepository;

    public DisasterRecoveryService(RegionDeploymentRepository regionDeploymentRepository,
                                   FailoverGroupRepository failoverGroupRepository,
                                   DrillConfigRepository drillConfigRepository) {
        this.regionDeploymentRepository = regionDeploymentRepository;
        this.failoverGroupRepository = failoverGroupRepository;
        this.drillConfigRepository = drillConfigRepository;
    }

    // --- Region Deployments ---

    public RegionDeployment addRegionDeployment(UUID environmentId, String region, boolean primary, int priority) {
        var deployment = new RegionDeployment(environmentId, region, primary, priority);
        return regionDeploymentRepository.save(deployment);
    }

    @Transactional(readOnly = true)
    public List<RegionDeployment> getRegionDeployments(UUID environmentId) {
        return regionDeploymentRepository.findByEnvironmentId(environmentId);
    }

    public RegionDeployment updateRegionStatus(UUID deploymentId, String status) {
        var deployment = regionDeploymentRepository.findById(deploymentId)
            .orElseThrow(() -> new IllegalArgumentException("Deployment not found: " + deploymentId));
        deployment.setStatus(status);
        deployment.setLastVerifiedAt(Instant.now());
        return regionDeploymentRepository.save(deployment);
    }

    // --- Failover Groups ---

    public FailoverGroup createFailoverGroup(UUID environmentId, String name, String primaryRegion,
                                              String secondaryRegions, int threshold, boolean autoFailover) {
        var group = new FailoverGroup(environmentId, name, primaryRegion,
            secondaryRegions, threshold, autoFailover);
        return failoverGroupRepository.save(group);
    }

    @Transactional(readOnly = true)
    public List<FailoverGroup> getFailoverGroups(UUID environmentId) {
        return failoverGroupRepository.findByEnvironmentId(environmentId);
    }

    @Transactional(readOnly = true)
    public FailoverGroup getFailoverGroup(UUID id) {
        return failoverGroupRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Failover group not found: " + id));
    }

    public FailoverGroup initiateFailover(UUID groupId) {
        var group = getFailoverGroup(groupId);
        group.setStatus(FailoverGroup.STATUS_FAILOVER_IN_PROGRESS);
        group.setLastFailoverAt(Instant.now());

        var regions = regionDeploymentRepository.findByEnvironmentId(group.getEnvironmentId());
        for (var region : regions) {
            if (region.isPrimary()) {
                region.setStatus(RegionDeployment.STATUS_FAILING_OVER);
                regionDeploymentRepository.save(region);
            }
        }

        return failoverGroupRepository.save(group);
    }

    public FailoverGroup completeFailover(UUID groupId, String newPrimaryRegion) {
        var group = getFailoverGroup(groupId);
        group.setPrimaryRegion(newPrimaryRegion);
        group.setStatus(FailoverGroup.STATUS_HEALTHY);

        var regions = regionDeploymentRepository.findByEnvironmentId(group.getEnvironmentId());
        for (var region : regions) {
            if (region.getRegion().equals(newPrimaryRegion)) {
                region.setPrimary(true);
                region.setStatus(RegionDeployment.STATUS_ACTIVE);
            } else {
                region.setPrimary(false);
                region.setStatus(RegionDeployment.STATUS_STANDBY);
            }
            regionDeploymentRepository.save(region);
        }

        return failoverGroupRepository.save(group);
    }

    // --- Drills ---

    public DrillConfig scheduleDrill(UUID failoverGroupId, String name, String description, Instant scheduledAt) {
        var drill = new DrillConfig(failoverGroupId, name, description, scheduledAt);
        return drillConfigRepository.save(drill);
    }

    @Transactional(readOnly = true)
    public List<DrillConfig> getDrills(UUID failoverGroupId) {
        return drillConfigRepository.findByFailoverGroupId(failoverGroupId);
    }

    public DrillConfig completeDrill(UUID drillId, boolean passed, String result) {
        var drill = drillConfigRepository.findById(drillId)
            .orElseThrow(() -> new IllegalArgumentException("Drill not found: " + drillId));
        drill.setStatus(passed ? DrillConfig.STATUS_PASSED : DrillConfig.STATUS_FAILED);
        drill.setResult(result);
        drill.setCompletedAt(Instant.now());

        var group = getFailoverGroup(drill.getFailoverGroupId());
        group.setLastDrillAt(Instant.now());
        failoverGroupRepository.save(group);

        return drillConfigRepository.save(drill);
    }
}
