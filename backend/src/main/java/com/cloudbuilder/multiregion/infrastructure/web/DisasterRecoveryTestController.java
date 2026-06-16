package com.cloudbuilder.multiregion.infrastructure.web;

import com.cloudbuilder.multiregion.domain.model.DRTestResult;
import com.cloudbuilder.multiregion.domain.service.DRTestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/multiregion/dr-tests")
@PreAuthorize("isAuthenticated()")
public class DisasterRecoveryTestController {

    private final DRTestService drTestService;

    public DisasterRecoveryTestController(DRTestService drTestService) {
        this.drTestService = drTestService;
    }

    @PostMapping("/plans/{planId}/run")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DRTestResult> runTest(@PathVariable UUID planId) {
        return ResponseEntity.ok(drTestService.runTest(planId, "current-user"));
    }

    @GetMapping("/plans/{planId}")
    public ResponseEntity<List<DRTestResult>> getTestResults(@PathVariable UUID planId) {
        return ResponseEntity.ok(drTestService.getTestResults(planId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DRTestResult> getTestResult(@PathVariable UUID id) {
        return drTestService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/plans/{planId}/stats")
    public ResponseEntity<TestStatsDto> getStats(@PathVariable UUID planId) {
        long total = drTestService.getTestCount(planId);
        long success = drTestService.getSuccessCount(planId);
        return ResponseEntity.ok(new TestStatsDto(total, success, total > 0 ? (success * 100 / total) : 0));
    }

    @GetMapping
    public ResponseEntity<List<DRTestResult>> getAll() {
        return ResponseEntity.ok(drTestService.getTestResultsByTenant("default"));
    }

    record TestStatsDto(long total, long success, long successRatePercent) {}
}
