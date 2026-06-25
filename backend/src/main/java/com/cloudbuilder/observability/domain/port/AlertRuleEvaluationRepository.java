package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.AlertRuleEvaluationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRuleEvaluationRepository extends JpaRepository<AlertRuleEvaluationEntity, String> {

    List<AlertRuleEvaluationEntity> findByAlertRuleIdAndTenantIdOrderByEvaluatedAtDesc(String alertRuleId, String tenantId);

    void deleteByEvaluatedAtBefore(java.time.Instant cutoff);
}
