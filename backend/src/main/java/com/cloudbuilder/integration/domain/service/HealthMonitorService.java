package com.cloudbuilder.integration.domain.service;

import com.cloudbuilder.integration.domain.model.Integration;
import com.cloudbuilder.integration.domain.port.IntegrationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * HealthMonitorService: Periodically checks health of connected integrations.
 */
@Service
public class HealthMonitorService {

    private static final Logger log = LoggerFactory.getLogger(HealthMonitorService.class);

    private final IntegrationRepository integrationRepository;
    private final IntegrationService integrationService;

    public HealthMonitorService(IntegrationRepository integrationRepository, IntegrationService integrationService) {
        this.integrationRepository = integrationRepository;
        this.integrationService = integrationService;
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void checkHealth() {
        List<Integration> connected = integrationRepository.findByTenantIdAndStatus(null, "CONNECTED");
        for (Integration integration : connected) {
            try {
                boolean healthy = performHealthCheck(integration);
                integrationService.updateHealth(integration.getId(), healthy ? "HEALTHY" : "DEGRADED");
            } catch (Exception e) {
                log.error("Health check failed for integration: {}", integration.getId(), e);
                integrationService.updateHealth(integration.getId(), "UNHEALTHY");
            }
        }
    }

    public Map<String, Object> getHealthStatus(String integrationId) {
        return integrationRepository.findById(integrationId)
                .map(i -> Map.<String, Object>of(
                    "integrationId", i.getId(),
                    "healthStatus", i.getHealthStatus(),
                    "lastCheck", i.getLastHealthCheck() != null ? i.getLastHealthCheck().toString() : null,
                    "status", i.getStatus()
                ))
                .orElse(Map.of("error", "Integration not found"));
    }

    private boolean performHealthCheck(Integration integration) {
        // In production, make API call to provider to check connectivity
        // For now, return true if integration is connected
        return "CONNECTED".equals(integration.getStatus());
    }
}
