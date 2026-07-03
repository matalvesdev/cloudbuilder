package com.cloudbuilder.integration.domain.port;

import com.cloudbuilder.integration.domain.model.Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, String> {
    List<Integration> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<Integration> findByTenantIdAndCategory(String tenantId, String category);
    List<Integration> findByTenantIdAndStatus(String tenantId, String status);
    Optional<Integration> findByTenantIdAndProviderId(String tenantId, String providerId);
    long countByTenantId(String tenantId);
    long countByTenantIdAndStatus(String tenantId, String status);
}
