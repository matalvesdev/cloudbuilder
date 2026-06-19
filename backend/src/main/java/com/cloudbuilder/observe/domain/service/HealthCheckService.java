package com.cloudbuilder.observe.domain.service;

import com.cloudbuilder.observe.domain.model.Alert;
import com.cloudbuilder.observe.domain.model.ServiceHealth;
import com.cloudbuilder.observe.domain.port.AlertRepository;
import com.cloudbuilder.observe.domain.port.ServiceHealthRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class HealthCheckService {

    private final ServiceHealthRepository serviceHealthRepository;
    private final AlertRepository alertRepository;

    public HealthCheckService(ServiceHealthRepository serviceHealthRepository,
                              AlertRepository alertRepository) {
        this.serviceHealthRepository = serviceHealthRepository;
        this.alertRepository = alertRepository;
    }

    public ServiceHealth recordHealth(String serviceName, String environmentId, String status,
                                      double latencyMs, double uptimePercent) {
        var health = new ServiceHealth(serviceName, environmentId, status, latencyMs, uptimePercent);
        var saved = serviceHealthRepository.save(health);

        if ("degraded".equals(status) || "down".equals(status)) {
            var severity = "down".equals(status) ? "critical" : "warning";
            var alert = new Alert(environmentId, severity,
                    "Serviço " + serviceName + " está " + status, "health-check");
            alertRepository.save(alert);
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public List<ServiceHealth> getServiceHealth(String environmentId) {
        return serviceHealthRepository.findByEnvironmentId(environmentId);
    }

    @Transactional(readOnly = true)
    public Optional<ServiceHealth> getLatestHealth(String serviceName, String environmentId) {
        return serviceHealthRepository.findTopByServiceNameAndEnvironmentIdOrderByCheckedAtDesc(
                serviceName, environmentId);
    }

    @Transactional(readOnly = true)
    public List<Alert> getActiveAlerts(String environmentId) {
        return alertRepository.findByEnvironmentIdOrderByTriggeredAtDesc(environmentId);
    }

    @Transactional(readOnly = true)
    public List<Alert> getOpenAlerts() {
        return alertRepository.findByStatus("OPEN");
    }

    public Alert resolveAlert(String alertId) {
        var alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));
        alert.setStatus("RESOLVED");
        alert.setResolvedAt(Instant.now());
        return alertRepository.save(alert);
    }
}
