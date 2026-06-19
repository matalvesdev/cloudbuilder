package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.IncidentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface ObserveIncidentRepository extends JpaRepository<IncidentEntity, String> {

    List<IncidentEntity> findByTenantIdAndStatus(String tenantId, String status);

    Optional<IncidentEntity> findByAlertRuleIdAndStatus(String alertRuleId, String status);
}
