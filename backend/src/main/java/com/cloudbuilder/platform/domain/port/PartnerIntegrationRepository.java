package com.cloudbuilder.platform.domain.port;

import com.cloudbuilder.platform.domain.model.PartnerIntegration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface PartnerIntegrationRepository extends JpaRepository<PartnerIntegration, String> {
    List<PartnerIntegration> findByStatus(String status);
    List<PartnerIntegration> findByIntegrationType(String integrationType);
}
