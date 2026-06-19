package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.AlertRuleEvaluationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlertRuleEvaluationRepository extends JpaRepository<AlertRuleEvaluationEntity, String> {

    void deleteByEvaluatedAtBefore(java.time.Instant cutoff);
}
