package com.cloudbuilder.integration.domain.service;

import com.cloudbuilder.integration.domain.model.Integration;
import com.cloudbuilder.integration.domain.port.IntegrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class IntegrationService {

    private final IntegrationRepository integrationRepository;

    public IntegrationService(IntegrationRepository integrationRepository) {
        this.integrationRepository = integrationRepository;
    }

    public record IntegrationResult(String id, String name, String providerId, String category, String status) {}

    public IntegrationResult createIntegration(String tenantId, String userId, String name, String providerId, String category, String config) {
        Integration integration = new Integration(tenantId, userId, name, providerId, category);
        integration.setConfig(config);
        integrationRepository.save(integration);
        return new IntegrationResult(integration.getId(), name, providerId, category, "PENDING");
    }

    @Transactional(readOnly = true)
    public List<Integration> listIntegrations(String tenantId) {
        return integrationRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public List<Integration> listByCategory(String tenantId, String category) {
        return integrationRepository.findByTenantIdAndCategory(tenantId, category);
    }

    @Transactional(readOnly = true)
    public Optional<Integration> getIntegration(String id) {
        return integrationRepository.findById(id);
    }

    public void connectIntegration(String id) {
        integrationRepository.findById(id).ifPresent(integration -> {
            integration.connect();
            integrationRepository.save(integration);
        });
    }

    public void disconnectIntegration(String id) {
        integrationRepository.findById(id).ifPresent(integration -> {
            integration.disconnect();
            integrationRepository.save(integration);
        });
    }

    public void failIntegration(String id, String error) {
        integrationRepository.findById(id).ifPresent(integration -> {
            integration.fail(error);
            integrationRepository.save(integration);
        });
    }

    public void updateHealth(String id, String healthStatus) {
        integrationRepository.findById(id).ifPresent(integration -> {
            integration.updateHealth(healthStatus);
            integrationRepository.save(integration);
        });
    }

    public void recordSync(String id) {
        integrationRepository.findById(id).ifPresent(integration -> {
            integration.setLastSyncAt(Instant.now());
            integrationRepository.save(integration);
        });
    }

    public void deleteIntegration(String id) {
        integrationRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats(String tenantId) {
        long total = integrationRepository.countByTenantId(tenantId);
        long connected = integrationRepository.countByTenantIdAndStatus(tenantId, "CONNECTED");
        long error = integrationRepository.countByTenantIdAndStatus(tenantId, "ERROR");
        return Map.of("total", total, "connected", connected, "error", error, "pending", total - connected - error);
    }
}
