package com.cloudbuilder.cost.infrastructure.web;

import com.cloudbuilder.cost.domain.model.CostForecast;
import com.cloudbuilder.cost.domain.service.CostForecastService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cost-forecasts")
public class CostForecastController {

    private final CostForecastService costForecastService;

    public CostForecastController(CostForecastService costForecastService) {
        this.costForecastService = costForecastService;
    }

    @GetMapping
    public ResponseEntity<List<CostForecast>> list(
            @RequestParam String tenantId,
            @RequestParam String environmentId) {
        return ResponseEntity.ok(
                costForecastService.getForecastsByEnvironment(tenantId, environmentId));
    }

    @GetMapping("/latest")
    public ResponseEntity<CostForecast> getLatest(@RequestParam String tenantId) {
        return costForecastService.getLatestForecast(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CostForecast> generate(
            @RequestParam String tenantId,
            @RequestParam String environmentId,
            @RequestParam(defaultValue = "MONTHLY") String period) {
        return ResponseEntity.ok(
                costForecastService.generateForecast(tenantId, environmentId, period));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CostForecast> getById(@PathVariable String id) {
        return costForecastService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
