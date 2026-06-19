package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.SloDefinitionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface SloDefinitionRepository extends JpaRepository<SloDefinitionEntity, String> {

    List<SloDefinitionEntity> findByTenantIdAndEnabledTrue(String tenantId);

    List<SloDefinitionEntity> findByTenantId(String tenantId);
}
