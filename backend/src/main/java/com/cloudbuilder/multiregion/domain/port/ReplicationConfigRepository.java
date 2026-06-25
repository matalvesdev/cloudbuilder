package com.cloudbuilder.multiregion.domain.port;

import com.cloudbuilder.multiregion.domain.model.ReplicationConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReplicationConfigRepository extends JpaRepository<ReplicationConfig, String> {

    List<ReplicationConfig> findByPlanId(String planId);

    List<ReplicationConfig> findBySourceRegionId(String sourceRegionId);

    List<ReplicationConfig> findByTargetRegionId(String targetRegionId);

    List<ReplicationConfig> findByStatus(String status);

    List<ReplicationConfig> findByPlanIdAndResourceType(String planId, String resourceType);

    List<ReplicationConfig> findByTenantId(String tenantId);
}
