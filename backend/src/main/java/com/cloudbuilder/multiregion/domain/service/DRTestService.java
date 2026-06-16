package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.DRTestResult;
import com.cloudbuilder.multiregion.domain.model.DisasterRecoveryPlan;
import com.cloudbuilder.multiregion.domain.port.DRTestResultRepository;
import com.cloudbuilder.multiregion.domain.port.DisasterRecoveryPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class DRTestService {

    private final DRTestResultRepository testResultRepository;
    private final DisasterRecoveryPlanRepository drPlanRepository;

    public DRTestService(DRTestResultRepository testResultRepository,
                          DisasterRecoveryPlanRepository drPlanRepository) {
        this.testResultRepository = testResultRepository;
        this.drPlanRepository = drPlanRepository;
    }

    public DRTestResult runTest(UUID planId, String initiatedBy) {
        DisasterRecoveryPlan plan = drPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("DR plan not found: " + planId));

        if (!"ACTIVE".equals(plan.getStatus())) {
            throw new IllegalStateException("Plan is not active. Current status: " + plan.getStatus());
        }

        plan.setStatus("TESTING");
        plan.setLastTestedAt(Instant.now());
        drPlanRepository.save(plan);

        int rtoActual = simulateRto(plan.getRtoMinutes());
        int rpoActual = simulateRpo(plan.getRpoMinutes());
        boolean passed = rtoActual <= plan.getRtoMinutes() * 60 && rpoActual <= plan.getRpoMinutes() * 60;
        String status = passed ? "SUCCESS" : "FAILED";
        int duration = rtoActual;

        String details = String.format("RTO: %ds (target: %ds), RPO: %ds (target: %ds)",
                rtoActual, plan.getRtoMinutes() * 60, rpoActual, plan.getRpoMinutes() * 60);

        DRTestResult result = new DRTestResult(planId, plan.getTenantId(),
                rtoActual, rpoActual, status, details, duration, initiatedBy);

        plan.setStatus("ACTIVE");
        drPlanRepository.save(plan);

        return testResultRepository.save(result);
    }

    public List<DRTestResult> getTestResults(UUID planId) {
        return testResultRepository.findByDrPlanIdOrderByTestedAtDesc(planId);
    }

    public List<DRTestResult> getTestResultsByTenant(String tenantId) {
        return testResultRepository.findByTenantIdOrderByTestedAtDesc(tenantId);
    }

    public Optional<DRTestResult> getById(UUID id) {
        return testResultRepository.findById(id);
    }

    public long getTestCount(UUID planId) {
        return testResultRepository.countByDrPlanId(planId);
    }

    public long getSuccessCount(UUID planId) {
        return testResultRepository.countByDrPlanIdAndStatus(planId, "SUCCESS");
    }

    private int simulateRto(int rtoMinutes) {
        int rtoSeconds = rtoMinutes * 60;
        double variance = 0.8 + Math.random() * 0.4;
        return (int) Math.round(rtoSeconds * variance);
    }

    private int simulateRpo(int rpoMinutes) {
        int rpoSeconds = rpoMinutes * 60;
        double variance = 0.5 + Math.random() * 0.8;
        return (int) Math.round(rpoSeconds * variance);
    }
}
