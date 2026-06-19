package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.AlertRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRuleEntity, String> {

    List<AlertRuleEntity> findByTenantIdAndEnabledTrue(String tenantId);

    List<AlertRuleEntity> findByTenantId(String tenantId);

    Optional<AlertRuleEntity> findByTenantIdAndName(String tenantId, String name);
}
