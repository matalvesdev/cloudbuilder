package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.SsoProviderConfig;
import com.cloudbuilder.iam.domain.port.SsoProviderConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SsoProviderService {

    private final SsoProviderConfigRepository repository;

    public SsoProviderService(SsoProviderConfigRepository repository) {
        this.repository = repository;
    }

    public SsoProviderConfig createConfig(String providerType, String providerName,
                                          String clientId, String encryptedClientSecret,
                                          String tenantId) {
        SsoProviderConfig config = new SsoProviderConfig(
                providerType, providerName, clientId, encryptedClientSecret, tenantId);
        return repository.save(config);
    }

    @Transactional(readOnly = true)
    public List<SsoProviderConfig> getConfigsByTenant(String tenantId) {
        return repository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public List<SsoProviderConfig> getEnabledConfigsByTenant(String tenantId) {
        return repository.findByTenantIdAndEnabledTrue(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<SsoProviderConfig> getConfigByTenantAndType(String tenantId, String providerType) {
        return repository.findByTenantIdAndProviderType(tenantId, providerType);
    }

    public Optional<SsoProviderConfig> toggleEnabled(String id, boolean enabled) {
        return repository.findById(id).map(config -> {
            config.setEnabled(enabled);
            config.setUpdatedAt(Instant.now());
            return repository.save(config);
        });
    }

    public Optional<SsoProviderConfig> updateCredentials(String id, String clientId, String encryptedClientSecret) {
        return repository.findById(id).map(config -> {
            if (clientId != null) config.setClientId(clientId);
            if (encryptedClientSecret != null) config.setClientSecret(encryptedClientSecret);
            config.setUpdatedAt(Instant.now());
            return repository.save(config);
        });
    }

    public Optional<SsoProviderConfig> updateAllowedDomains(String id, String allowedDomains) {
        return repository.findById(id).map(config -> {
            config.setAllowedDomains(allowedDomains);
            config.setUpdatedAt(Instant.now());
            return repository.save(config);
        });
    }

    public void deleteConfig(String id) {
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Optional<SsoProviderConfig> getConfig(String id) {
        return repository.findById(id);
    }
}
