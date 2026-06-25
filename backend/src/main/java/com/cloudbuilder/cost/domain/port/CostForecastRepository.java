package com.cloudbuilder.cost.domain.port;

import com.cloudbuilder.cost.domain.model.CostForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CostForecastRepository extends JpaRepository<CostForecast, String> {

    List<CostForecast> findByTenantIdAndEnvironmentId(String tenantId, String environmentId);

    @Query("SELECT c FROM CostForecast c WHERE c.tenantId = ?1 ORDER BY c.createdAt DESC")
    List<CostForecast> findLatestByTenantId(String tenantId);
}
