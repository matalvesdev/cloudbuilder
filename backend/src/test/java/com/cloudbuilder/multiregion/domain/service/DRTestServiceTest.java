package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.DRTestResult;
import com.cloudbuilder.multiregion.domain.model.DisasterRecoveryPlan;
import com.cloudbuilder.multiregion.domain.model.Region;
import com.cloudbuilder.multiregion.domain.port.DRTestResultRepository;
import com.cloudbuilder.multiregion.domain.port.DisasterRecoveryPlanRepository;
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
class DRTestServiceTest {

    @Mock
    private DRTestResultRepository testResultRepository;

    @Mock
    private DisasterRecoveryPlanRepository drPlanRepository;

    private DRTestService drTestService;

    @BeforeEach
    void setUp() {
        drTestService = new DRTestService(testResultRepository, drPlanRepository);
    }

    private DisasterRecoveryPlan createActivePlan() {
        var primary = new Region("us-east-1", "US East", "aws", "US", true);
        var dr = new Region("us-west-2", "US West", "aws", "US", false);
        return new DisasterRecoveryPlan("t1", "DR Plan", "Desc", primary, dr, "SYNC", 15, 60);
    }

    @Test
    void runTest_ShouldExecuteAndReturnResult() {
        var plan = createActivePlan();
        var planId = plan.getId();
        when(drPlanRepository.findById(planId)).thenReturn(Optional.of(plan));
        when(drPlanRepository.save(any(DisasterRecoveryPlan.class))).thenAnswer(i -> i.getArgument(0));
        when(testResultRepository.save(any(DRTestResult.class))).thenAnswer(i -> i.getArgument(0));

        var result = drTestService.runTest(planId, "admin");

        assertNotNull(result);
        assertEquals("t1", result.getTenantId());
        assertTrue(result.getRtoActualSeconds() > 0);
        assertTrue(result.getRpoActualSeconds() >= 0);
        verify(testResultRepository).save(any(DRTestResult.class));
    }

    @Test
    void runTest_WhenPlanNotFound_ShouldThrow() {
        when(drPlanRepository.findById(any())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> drTestService.runTest(UUID.randomUUID().toString(), "admin"));
    }

    @Test
    void runTest_WhenPlanNotActive_ShouldThrow() {
        var plan = createActivePlan();
        plan.setStatus("INACTIVE");
        var planId = plan.getId();
        when(drPlanRepository.findById(planId)).thenReturn(Optional.of(plan));

        assertThrows(IllegalStateException.class, () -> drTestService.runTest(planId, "admin"));
    }

    @Test
    void getTestResults_ShouldReturn() {
        var planId = UUID.randomUUID().toString();
        when(testResultRepository.findByDrPlanIdOrderByTestedAtDesc(planId)).thenReturn(List.of());

        var result = drTestService.getTestResults(planId);
        assertTrue(result.isEmpty());
    }

    @Test
    void getTestResultsByTenant_ShouldReturn() {
        when(testResultRepository.findByTenantIdOrderByTestedAtDesc("t1")).thenReturn(List.of());
        var result = drTestService.getTestResultsByTenant("t1");
        assertTrue(result.isEmpty());
    }

    @Test
    void getById_ShouldReturn() {
        var id = UUID.randomUUID().toString();
        when(testResultRepository.findById(id)).thenReturn(Optional.empty());
        var result = drTestService.getById(id);
        assertTrue(result.isEmpty());
    }

    @Test
    void getTestCount_ShouldReturn() {
        var planId = UUID.randomUUID().toString();
        when(testResultRepository.countByDrPlanId(planId)).thenReturn(5L);
        assertEquals(5L, drTestService.getTestCount(planId));
    }

    @Test
    void getSuccessCount_ShouldReturn() {
        var planId = UUID.randomUUID().toString();
        when(testResultRepository.countByDrPlanIdAndStatus(planId, "SUCCESS")).thenReturn(3L);
        assertEquals(3L, drTestService.getSuccessCount(planId));
    }
}
