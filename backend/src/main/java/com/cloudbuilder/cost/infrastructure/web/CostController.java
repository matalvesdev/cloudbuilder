package com.cloudbuilder.cost.infrastructure.web;

import com.cloudbuilder.cost.domain.model.Budget;
import com.cloudbuilder.cost.domain.model.CostRecord;
import com.cloudbuilder.cost.domain.service.CostService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cost")
public class CostController {

    private final CostService costService;

    public CostController(CostService costService) {
        this.costService = costService;
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
    public ResponseEntity<CostRecord> importRecord(@RequestBody CostRecord record) {
        return ResponseEntity.ok(costService.importCostRecord(record));
    }

    @GetMapping("/records/{environmentId}")
    public ResponseEntity<List<CostRecord>> getRecords(@PathVariable String environmentId) {
        return ResponseEntity.ok(costService.getCosts(environmentId, null, null));
    }

    @PostMapping("/budgets")
    public ResponseEntity<Budget> createBudget(@RequestBody Budget budget) {
        return ResponseEntity.ok(costService.createBudget(budget));
    }

    @GetMapping("/budgets/{environmentId}")
    public ResponseEntity<List<Budget>> getBudgets(@PathVariable String environmentId) {
        return ResponseEntity.ok(costService.getBudgets(environmentId));
    }
}
