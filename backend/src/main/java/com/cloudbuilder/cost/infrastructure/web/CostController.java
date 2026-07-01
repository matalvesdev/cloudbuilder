package com.cloudbuilder.cost.infrastructure.web;

import com.cloudbuilder.cost.application.dto.BudgetAlert;
import com.cloudbuilder.cost.application.dto.CostAnomaly;
import com.cloudbuilder.cost.application.dto.CostProjectionPoint;
import com.cloudbuilder.cost.domain.model.Budget;
import com.cloudbuilder.cost.domain.model.CostRecord;
import com.cloudbuilder.cost.domain.model.CostScenario;
import com.cloudbuilder.cost.domain.service.AnomalyDetectionService;
import com.cloudbuilder.cost.domain.service.BudgetAlertService;
import com.cloudbuilder.cost.domain.service.CostProjectionService;
import com.cloudbuilder.cost.domain.service.CostScenarioService;
import com.cloudbuilder.cost.domain.service.CostService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cost")
@PreAuthorize("isAuthenticated()")
public class CostController {

    private final CostService costService;
    private final CostScenarioService costScenarioService;
    private final AnomalyDetectionService anomalyDetectionService;
    private final CostProjectionService costProjectionService;
    private final BudgetAlertService budgetAlertService;

    public CostController(CostService costService, CostScenarioService costScenarioService,
                          AnomalyDetectionService anomalyDetectionService,
                          CostProjectionService costProjectionService,
                          BudgetAlertService budgetAlertService) {
        this.costService = costService;
        this.costScenarioService = costScenarioService;
        this.anomalyDetectionService = anomalyDetectionService;
        this.costProjectionService = costProjectionService;
        this.budgetAlertService = budgetAlertService;
    }

    @GetMapping("/overview/{environmentId}")
    public ResponseEntity<Map<String, Object>> getOverview(
            @PathVariable String environmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        var today = LocalDate.now();
        if (start == null) start = today.withDayOfMonth(1);
        if (end == null) end = today;

        var totalCost = costService.getTotalCost(environmentId, start, end);
        var topServices = costService.getTopServicesByCost(environmentId);
        var forecast = costService.getMonthlyForecast(environmentId);
        var budgets = costService.getBudgets(environmentId);

        var topList = topServices.stream()
                .map(row -> Map.of("service", row[0], "cost", row[1]))
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalCost", totalCost);
        response.put("forecast", forecast);
        response.put("periodStart", start.toString());
        response.put("periodEnd", end.toString());
        response.put("topServices", topList);
        response.put("budgets", budgets);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/records")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CostRecord> importRecord(@RequestBody CostRecord record) {
        return ResponseEntity.ok(costService.importCostRecord(record));
    }

    @GetMapping("/records/{environmentId}")
    public ResponseEntity<List<CostRecord>> getRecords(@PathVariable String environmentId) {
        return ResponseEntity.ok(costService.getCosts(environmentId, null, null));
    }

    @PostMapping("/budgets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Budget> createBudget(@RequestBody Budget budget) {
        return ResponseEntity.ok(costService.createBudget(budget));
    }

    @GetMapping("/budgets/{environmentId}")
    public ResponseEntity<List<Budget>> getBudgets(@PathVariable String environmentId) {
        return ResponseEntity.ok(costService.getBudgets(environmentId));
    }

    /* ─── Anomaly Detection ───────────────────────────────────────── */

    @GetMapping("/anomalies/{environmentId}")
    public ResponseEntity<List<CostAnomaly>> getAnomalies(
            @PathVariable String environmentId,
            @RequestParam(defaultValue = "30") int lookbackDays) {
        var anomalies = anomalyDetectionService.detectAnomalies(environmentId, lookbackDays);
        return ResponseEntity.ok(anomalies);
    }

    /* ─── Cost Projection ─────────────────────────────────────────── */

    @GetMapping("/projection/{environmentId}")
    public ResponseEntity<List<CostProjectionPoint>> getProjection(
            @PathVariable String environmentId,
            @RequestParam(defaultValue = "30") int projectionDays) {
        var projection = costProjectionService.projectCosts(environmentId, projectionDays);
        return ResponseEntity.ok(projection);
    }

    /* ─── Budget Alerts ───────────────────────────────────────────── */

    @GetMapping("/budget-alerts/{environmentId}")
    public ResponseEntity<List<BudgetAlert>> getBudgetAlerts(@PathVariable String environmentId) {
        var alerts = budgetAlertService.evaluateBudgets(environmentId);
        return ResponseEntity.ok(alerts);
    }

    /* ─── What-if Scenarios ───────────────────────────────────────── */

    @PostMapping("/scenarios")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CostScenario> createScenario(@RequestBody CostScenario scenario) {
        return ResponseEntity.ok(costScenarioService.create(scenario));
    }

    @GetMapping("/scenarios/{id}")
    public ResponseEntity<CostScenario> getScenario(@PathVariable String id) {
        var scenario = costScenarioService.findById(id);
        if (scenario == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(scenario);
    }

    @GetMapping("/scenarios/environment/{environmentId}")
    public ResponseEntity<List<CostScenario>> getScenariosByEnvironment(@PathVariable String environmentId) {
        return ResponseEntity.ok(costScenarioService.findByEnvironment(environmentId));
    }

    @GetMapping("/scenarios/canvas/{canvasId}")
    public ResponseEntity<List<CostScenario>> getScenariosByCanvas(@PathVariable String canvasId) {
        return ResponseEntity.ok(costScenarioService.findByCanvas(canvasId));
    }

    @DeleteMapping("/scenarios/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteScenario(@PathVariable String id) {
        costScenarioService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
