package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.SsoProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SsoProviderConfigRepository extends JpaRepository<SsoProviderConfig, String> {
    List<SsoProviderConfig> findByTenantId(String tenantId);
    List<SsoProviderConfig> findByTenantIdAndEnabledTrue(String tenantId);
    Optional<SsoProviderConfig> findByTenantIdAndProviderType(String tenantId, String providerType);
    List<SsoProviderConfig> findByProviderType(String providerType);
}
