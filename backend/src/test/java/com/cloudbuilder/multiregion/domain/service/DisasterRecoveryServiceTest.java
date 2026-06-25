package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.DisasterRecoveryPlan;
import com.cloudbuilder.multiregion.domain.model.Region;
import com.cloudbuilder.multiregion.domain.port.DisasterRecoveryPlanRepository;
import com.cloudbuilder.multiregion.domain.port.RegionHealthRepository;
import com.cloudbuilder.multiregion.domain.port.RegionRepository;
import com.cloudbuilder.multiregion.domain.port.ReplicationConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DisasterRecoveryServiceTest {

    @Mock
    private DisasterRecoveryPlanRepository drPlanRepository;

    @Mock
    private RegionRepository regionRepository;

    @Mock
    private RegionHealthRepository regionHealthRepository;

    @Mock
    private ReplicationConfigRepository replicationConfigRepository;

    private DisasterRecoveryService drService;

    @BeforeEach
    void setUp() {
        drService = new DisasterRecoveryService(drPlanRepository, regionRepository, regionHealthRepository, replicationConfigRepository);
    }

    private Region createRegion(String code) {
        var region = new Region(code, code, "aws", "US", false);
        // Use reflection to set ID for testing
        return region;
    }

    @Test
    void createPlan_ShouldSaveAndReturn() {
        var primary = new Region("us-east-1", "US East", "aws", "US", true);
        var dr = new Region("us-west-2", "US West", "aws", "US", false);

        when(regionRepository.findById(primary.getId())).thenReturn(Optional.of(primary));
        when(regionRepository.findById(dr.getId())).thenReturn(Optional.of(dr));
        when(drPlanRepository.save(any(DisasterRecoveryPlan.class))).thenAnswer(i -> i.getArgument(0));

        var result = drService.createPlan("t1", "DR Plan", "Desc", primary.getId(), dr.getId(), "SYNC", 15, 60);

        assertNotNull(result);
        assertEquals("DR Plan", result.getName());
        assertEquals("ACTIVE", result.getStatus());
        verify(drPlanRepository).save(any(DisasterRecoveryPlan.class));
    }

    @Test
    void createPlan_WithSameRegion_ShouldThrow() {
        var regionId = UUID.randomUUID().toString();
        assertThrows(IllegalArgumentException.class,
                () -> drService.createPlan("t1", "P", "D", regionId, regionId, "SYNC", 15, 60));
    }

    @Test
    void createPlan_WithInvalidStrategy_ShouldThrow() {
        var primary = new Region("us-east-1", "US East", "aws", "US", true);
        var dr = new Region("us-west-2", "US West", "aws", "US", false);

        assertThrows(IllegalArgumentException.class,
                () -> drService.createPlan("t1", "P", "D", primary.getId(), dr.getId(), "INVALID", 15, 60));
    }

    @Test
    void createPlan_WhenRegionNotFound_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        when(regionRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> drService.createPlan("t1", "P", "D", id, UUID.randomUUID().toString(), "SYNC", 15, 60));
    }

    @Test
    void getPlan_ShouldReturn() {
        var id = UUID.randomUUID().toString();
        var primary = new Region("us-east-1", "US East", "aws", "US", true);
        var dr = new Region("us-west-2", "US West", "aws", "US", false);
        var plan = new DisasterRecoveryPlan("t1", "P", "D", primary, dr, "ASYNC", 15, 60);
        when(drPlanRepository.findById(id)).thenReturn(Optional.of(plan));

        var result = drService.getPlan(id);

        assertTrue(result.isPresent());
    }

    @Test
    void getPlansByTenant_ShouldReturn() {
        when(drPlanRepository.findByTenantId("t1")).thenReturn(List.of());

        var result = drService.getPlansByTenant("t1");

        assertTrue(result.isEmpty());
    }

    @Test
    void getActivePlansByTenant_ShouldReturn() {
        when(drPlanRepository.findByTenantIdAndStatus("t1", "ACTIVE")).thenReturn(List.of());

        var result = drService.getActivePlansByTenant("t1");

        assertTrue(result.isEmpty());
    }

    @Test
    void updatePlan_ShouldUpdateFields() {
        var primary = new Region("us-east-1", "US East", "aws", "US", true);
        var dr = new Region("us-west-2", "US West", "aws", "US", false);
        var plan = new DisasterRecoveryPlan("t1", "Original", "Original Desc", primary, dr, "SYNC", 15, 60);
        var id = plan.getId();
        when(drPlanRepository.findById(id)).thenReturn(Optional.of(plan));
        when(drPlanRepository.save(any(DisasterRecoveryPlan.class))).thenAnswer(i -> i.getArgument(0));

        var result = drService.updatePlan(id, "Updated Name", "Updated Desc", "ASYNC", 30, 120, null, null);

        assertEquals("Updated Name", result.getName());
        assertEquals("ASYNC", result.getReplicationStrategy());
        assertEquals(30, result.getRpoMinutes());
        assertEquals(120, result.getRtoMinutes());
    }

    @Test
    void updatePlan_WhenNotFound_ShouldThrow() {
        when(drPlanRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> drService.updatePlan(UUID.randomUUID().toString(), "N", null, null, null, null, null, null));
    }

    @Test
    void triggerFailover_ShouldChangeStatus() {
        var primary = new Region("us-east-1", "US East", "aws", "US", true);
        var dr = new Region("us-west-2", "US West", "aws", "US", false);
        var plan = new DisasterRecoveryPlan("t1", "P", "D", primary, dr, "ASYNC", 15, 60);
        var id = plan.getId();
        when(drPlanRepository.findById(id)).thenReturn(Optional.of(plan));
        when(drPlanRepository.save(any(DisasterRecoveryPlan.class))).thenAnswer(i -> i.getArgument(0));

        var result = drService.triggerFailover(id, "admin");

        assertEquals("FAILOVER", result.getStatus());
        assertNotNull(result.getLastFailoverAt());
    }

    @Test
    void triggerFailover_WhenNotActive_ShouldThrow() {
        var primary = new Region("us-east-1", "US East", "aws", "US", true);
        var dr = new Region("us-west-2", "US West", "aws", "US", false);
        var plan = new DisasterRecoveryPlan("t1", "P", "D", primary, dr, "SYNC", 15, 60);
        plan.setStatus("INACTIVE");
        var id = plan.getId();
        when(drPlanRepository.findById(id)).thenReturn(Optional.of(plan));

        assertThrows(IllegalStateException.class, () -> drService.triggerFailover(id, "admin"));
    }

    @Test
    void triggerFallback_ShouldRestoreStatus() {
        var primary = new Region("us-east-1", "US East", "aws", "US", true);
        var dr = new Region("us-west-2", "US West", "aws", "US", false);
        var plan = new DisasterRecoveryPlan("t1", "P", "D", primary, dr, "ASYNC", 15, 60);
        plan.setStatus("FAILOVER");
        var id = plan.getId();
        when(drPlanRepository.findById(id)).thenReturn(Optional.of(plan));
        when(drPlanRepository.save(any(DisasterRecoveryPlan.class))).thenAnswer(i -> i.getArgument(0));

        var result = drService.triggerFallback(id);

        assertEquals("ACTIVE", result.getStatus());
    }

    @Test
    void triggerFallback_WhenNotFailover_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        var plan = mock(DisasterRecoveryPlan.class);
        when(plan.getStatus()).thenReturn("ACTIVE");
        when(drPlanRepository.findById(id)).thenReturn(Optional.of(plan));

        assertThrows(IllegalStateException.class, () -> drService.triggerFallback(id));
    }

    @Test
    void testPlan_ShouldSetTestingStatus() {
        var primary = new Region("us-east-1", "US East", "aws", "US", true);
        var dr = new Region("us-west-2", "US West", "aws", "US", false);
        var plan = new DisasterRecoveryPlan("t1", "P", "D", primary, dr, "ASYNC", 15, 60);
        var id = plan.getId();
        when(drPlanRepository.findById(id)).thenReturn(Optional.of(plan));
        when(drPlanRepository.save(any(DisasterRecoveryPlan.class))).thenAnswer(i -> i.getArgument(0));

        var result = drService.testPlan(id);

        assertEquals("TESTING", result.getStatus());
        assertNotNull(result.getLastTestedAt());
    }

    @Test
    void deletePlan_ShouldDelete() {
        var id = UUID.randomUUID().toString();
        when(drPlanRepository.existsById(id)).thenReturn(true);

        drService.deletePlan(id);

        verify(drPlanRepository).deleteById(id);
    }

    @Test
    void deletePlan_WhenNotFound_ShouldThrow() {
        when(drPlanRepository.existsById(any())).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> drService.deletePlan(UUID.randomUUID().toString()));
    }

    @Test
    void getPlansByRegion_ShouldReturn() {
        var regionId = UUID.randomUUID().toString();
        when(drPlanRepository.findByRegionId(regionId)).thenReturn(List.of());

        var result = drService.getPlansByRegion(regionId);

        assertTrue(result.isEmpty());
    }

    @Test
    void getPlansByStatus_ShouldReturn() {
        when(drPlanRepository.findByStatus("ACTIVE")).thenReturn(List.of());

        var result = drService.getPlansByStatus("ACTIVE");

        assertTrue(result.isEmpty());
    }
}
