package com.cloudbuilder.aiops.domain.port;

import com.cloudbuilder.aiops.domain.model.RemediationAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RemediationRepository extends JpaRepository<RemediationAction, String> {
    List<RemediationAction> findByIncidentId(String incidentId);
    List<RemediationAction> findByIncidentIdAndStatus(String incidentId, String status);
    List<RemediationAction> findByStatus(String status);
    List<RemediationAction> findByAiSuggestedTrue();
}
