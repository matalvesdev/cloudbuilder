package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.DrillConfig;
import com.cloudbuilder.provision.domain.model.FailoverGroup;
import com.cloudbuilder.provision.domain.model.RegionDeployment;
import com.cloudbuilder.provision.domain.port.DrillConfigRepository;
import com.cloudbuilder.provision.domain.port.FailoverGroupRepository;
import com.cloudbuilder.provision.domain.port.RegionDeploymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DisasterRecoveryServiceTest {

    @Mock
    private RegionDeploymentRepository regionDeploymentRepository;

    @Mock
    private FailoverGroupRepository failoverGroupRepository;

    @Mock
    private DrillConfigRepository drillConfigRepository;

    private DisasterRecoveryService service;

    private String envId;
    private String groupId;

    @BeforeEach
    void setUp() {
        service = new DisasterRecoveryService(
                regionDeploymentRepository, failoverGroupRepository, drillConfigRepository);
        envId = UUID.randomUUID().toString();
        groupId = UUID.randomUUID().toString();
    }

    // --- Region Deployments ---

    @Test
    void addRegionDeployment_ShouldSaveAndReturn() {
        var deployment = new RegionDeployment(envId, "us-east-1", true, 1);
        when(regionDeploymentRepository.save(any(RegionDeployment.class))).thenReturn(deployment);

        var result = service.addRegionDeployment(envId, "us-east-1", true, 1);

        assertEquals("us-east-1", result.getRegion());
        assertTrue(result.isPrimary());
        assertEquals("ACTIVE", result.getStatus());
        verify(regionDeploymentRepository).save(any(RegionDeployment.class));
    }

    @Test
    void getRegionDeployments_ShouldReturnList() {
        var dep = new RegionDeployment(envId, "us-east-1", true, 1);
        when(regionDeploymentRepository.findByEnvironmentId(envId)).thenReturn(List.of(dep));

        var result = service.getRegionDeployments(envId);

        assertEquals(1, result.size());
        assertEquals("us-east-1", result.get(0).getRegion());
    }

    @Test
    void updateRegionStatus_ShouldUpdateAndReturn() {
        var depId = UUID.randomUUID().toString();
        var dep = new RegionDeployment(envId, "us-east-1", true, 1);
        when(regionDeploymentRepository.findById(depId)).thenReturn(Optional.of(dep));
        when(regionDeploymentRepository.save(dep)).thenAnswer(i -> i.getArgument(0));

        var result = service.updateRegionStatus(depId, "FAILED");

        assertEquals("FAILED", result.getStatus());
        assertNotNull(result.getLastVerifiedAt());
    }

    @Test
    void updateRegionStatus_WhenNotFound_ShouldThrow() {
        when(regionDeploymentRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.updateRegionStatus(UUID.randomUUID().toString(), "FAILED"));
    }

    // --- Failover Groups ---

    @Test
    void createFailoverGroup_ShouldSaveAndReturn() {
        var group = new FailoverGroup(envId, "prod-failover", "us-east-1",
                "us-west-1", 5, true);
        when(failoverGroupRepository.save(any(FailoverGroup.class))).thenReturn(group);

        var result = service.createFailoverGroup(envId, "prod-failover",
                "us-east-1", "us-west-1", 5, true);

        assertEquals("prod-failover", result.getName());
        assertEquals("HEALTHY", result.getStatus());
    }

    @Test
    void getFailoverGroups_ShouldReturnList() {
        var group = new FailoverGroup(envId, "fg1", "us-east-1", "us-west-1", 5, true);
        when(failoverGroupRepository.findByEnvironmentId(envId)).thenReturn(List.of(group));

        var result = service.getFailoverGroups(envId);

        assertEquals(1, result.size());
    }

    @Test
    void getFailoverGroup_WhenFound_ShouldReturn() {
        var group = new FailoverGroup(envId, "fg1", "us-east-1", "us-west-1", 5, true);
        when(failoverGroupRepository.findById(groupId)).thenReturn(Optional.of(group));

        var result = service.getFailoverGroup(groupId);

        assertEquals("fg1", result.getName());
    }

    @Test
    void getFailoverGroup_WhenNotFound_ShouldThrow() {
        when(failoverGroupRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.getFailoverGroup(UUID.randomUUID().toString()));
    }

    @Test
    void initiateFailover_ShouldSetInProgressAndUpdateRegions() {
        var group = new FailoverGroup(envId, "fg1", "us-east-1", "us-west-1", 5, true);
        var primary = new RegionDeployment(envId, "us-east-1", true, 1);

        when(failoverGroupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(regionDeploymentRepository.findByEnvironmentId(envId)).thenReturn(List.of(primary));
        when(regionDeploymentRepository.save(primary)).thenAnswer(i -> i.getArgument(0));
        when(failoverGroupRepository.save(group)).thenAnswer(i -> i.getArgument(0));

        var result = service.initiateFailover(groupId);

        assertEquals("FAILOVER_IN_PROGRESS", result.getStatus());
        assertNotNull(result.getLastFailoverAt());
        assertEquals("FAILING_OVER", primary.getStatus());
    }

    @Test
    void completeFailover_ShouldUpdatePrimaryAndRegions() {
        var group = new FailoverGroup(envId, "fg1", "us-east-1", "us-west-1", 5, true);
        var primary = new RegionDeployment(envId, "us-east-1", true, 1);
        var secondary = new RegionDeployment(envId, "us-west-1", false, 2);

        when(failoverGroupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(regionDeploymentRepository.findByEnvironmentId(envId))
                .thenReturn(List.of(primary, secondary));
        when(regionDeploymentRepository.save(any(RegionDeployment.class)))
                .thenAnswer(i -> i.getArgument(0));
        when(failoverGroupRepository.save(group)).thenAnswer(i -> i.getArgument(0));

        var result = service.completeFailover(groupId, "us-west-1");

        assertEquals("HEALTHY", result.getStatus());
        assertEquals("us-west-1", result.getPrimaryRegion());
        // Secondary should be promoted to primary
        assertFalse(primary.isPrimary());
        assertTrue(secondary.isPrimary());
    }

    // --- Drills ---

    @Test
    void scheduleDrill_ShouldSaveAndReturn() {
        var scheduledAt = Instant.now().plusSeconds(3600);
        var drill = new DrillConfig(groupId, "Q1-drill", "description", scheduledAt);
        when(drillConfigRepository.save(any(DrillConfig.class))).thenReturn(drill);

        var result = service.scheduleDrill(groupId, "Q1-drill", "description", scheduledAt);

        assertEquals("Q1-drill", result.getName());
        assertEquals("SCHEDULED", result.getStatus());
    }

    @Test
    void getDrills_ShouldReturnList() {
        var drill = new DrillConfig(groupId, "drill1", "desc", Instant.now());
        when(drillConfigRepository.findByFailoverGroupId(groupId)).thenReturn(List.of(drill));

        var result = service.getDrills(groupId);

        assertEquals(1, result.size());
    }

    @Test
    void completeDrill_ShouldUpdateStatus() {
        var drillId = UUID.randomUUID().toString();
        var drill = new DrillConfig(groupId, "drill1", "desc", Instant.now());
        var group = new FailoverGroup(envId, "fg1", "us-east-1", "us-west-1", 5, true);

        when(drillConfigRepository.findById(drillId)).thenReturn(Optional.of(drill));
        when(failoverGroupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(drillConfigRepository.save(drill)).thenAnswer(i -> i.getArgument(0));
        when(failoverGroupRepository.save(group)).thenAnswer(i -> i.getArgument(0));

        var result = service.completeDrill(drillId, true, "All checks passed");

        assertEquals("PASSED", result.getStatus());
        assertEquals("All checks passed", result.getResult());
        assertNotNull(result.getCompletedAt());
        assertNotNull(group.getLastDrillAt());
    }

    @Test
    void completeDrill_Failed_ShouldSetFailedStatus() {
        var drillId = UUID.randomUUID().toString();
        var drill = new DrillConfig(groupId, "drill1", "desc", Instant.now());
        var group = new FailoverGroup(envId, "fg1", "us-east-1", "us-west-1", 5, true);

        when(drillConfigRepository.findById(drillId)).thenReturn(Optional.of(drill));
        when(failoverGroupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(drillConfigRepository.save(drill)).thenAnswer(i -> i.getArgument(0));
        when(failoverGroupRepository.save(group)).thenAnswer(i -> i.getArgument(0));

        var result = service.completeDrill(drillId, false, "Timeout during failover");

        assertEquals("FAILED", result.getStatus());
        assertEquals("Timeout during failover", result.getResult());
    }

    @Test
    void completeDrill_WhenDrillNotFound_ShouldThrow() {
        when(drillConfigRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.completeDrill(UUID.randomUUID().toString(), true, "ok"));
    }
}
