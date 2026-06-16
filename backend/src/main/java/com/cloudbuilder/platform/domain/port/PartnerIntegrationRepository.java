package com.cloudbuilder.platform.domain.port;

import com.cloudbuilder.platform.domain.model.PartnerIntegration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PartnerIntegrationRepository extends JpaRepository<PartnerIntegration, UUID> {
    List<PartnerIntegration> findByStatus(String status);
    List<PartnerIntegration> findByIntegrationType(String integrationType);
}
