package com.cloudbuilder.observe.infrastructure.web;

import com.cloudbuilder.observe.application.dto.AlertDTO;
import com.cloudbuilder.observe.application.dto.ObserveDashboardDTO;
import com.cloudbuilder.observe.application.dto.ServiceHealthDTO;
import com.cloudbuilder.observe.domain.model.ServiceHealth;
import com.cloudbuilder.observe.domain.service.HealthCheckService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/observe")
public class ObserveController {

    private final HealthCheckService healthCheckService;

    public ObserveController(HealthCheckService healthCheckService) {
        this.healthCheckService = healthCheckService;
    }

    @GetMapping("/dashboard/{environmentId}")
    public ResponseEntity<ObserveDashboardDTO> getDashboard(@PathVariable String environmentId) {
        var services = healthCheckService.getServiceHealth(environmentId);
        var alerts = healthCheckService.getActiveAlerts(environmentId);
        var total = services.size();
        var degraded = services.stream().filter(s -> "degraded".equals(s.getStatus())).count();
        var down = services.stream().filter(s -> "down".equals(s.getStatus())).count();
        var avgLatency = services.stream().mapToDouble(ServiceHealth::getLatencyMs).average().orElse(0);
        var avgUptime = services.stream().mapToDouble(ServiceHealth::getUptimePercent).average().orElse(0);

        var dto = new ObserveDashboardDTO(
                total, (int) degraded, (int) down,
                avgLatency, avgUptime,
                services.stream().map(ServiceHealthDTO::from).toList(),
                alerts.stream().map(AlertDTO::from).toList());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/health")
    public ResponseEntity<ServiceHealthDTO> recordHealth(@RequestBody RecordHealthRequest req) {
        var h = healthCheckService.recordHealth(
                req.serviceName(), req.environmentId(), req.status(),
                req.latencyMs(), req.uptimePercent());
        return ResponseEntity.ok(ServiceHealthDTO.from(h));
    }

    @GetMapping("/alerts/{environmentId}")
    public ResponseEntity<?> getAlerts(@PathVariable String environmentId) {
        var alerts = healthCheckService.getActiveAlerts(environmentId);
        return ResponseEntity.ok(alerts.stream().map(AlertDTO::from).toList());
    }

    @PostMapping("/alerts/{alertId}/resolve")
    public ResponseEntity<AlertDTO> resolveAlert(@PathVariable UUID alertId) {
        var alert = healthCheckService.resolveAlert(alertId);
        return ResponseEntity.ok(AlertDTO.from(alert));
    }

    record RecordHealthRequest(String serviceName, String environmentId, String status,
                               double latencyMs, double uptimePercent) {}
}
