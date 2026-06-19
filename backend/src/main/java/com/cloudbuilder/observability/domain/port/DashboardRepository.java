package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.DashboardEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface DashboardRepository extends JpaRepository<DashboardEntity, String> {

    List<DashboardEntity> findByTenantId(String tenantId);
}
