package com.cloudbuilder.analytics.domain.port;

import com.cloudbuilder.analytics.domain.model.AnalyticsRollupDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for daily analytics rollups.
 */
public interface AnalyticsRollupDailyRepository extends JpaRepository<AnalyticsRollupDaily, String> {

    List<AnalyticsRollupDaily> findByTenantIdAndRollupDateBetween(
        String tenantId, LocalDate start, LocalDate end);

    Optional<AnalyticsRollupDaily> findByTenantIdAndModuleAndActionAndRollupDate(
        String tenantId, String module, String action, LocalDate rollupDate);

    @Query("SELECT r.module, SUM(r.eventCount) FROM AnalyticsRollupDaily r " +
           "WHERE r.tenantId = :tenantId AND r.rollupDate >= :start " +
           "GROUP BY r.module ORDER BY SUM(r.eventCount) DESC")
    List<Object[]> sumModuleUsage(@Param("tenantId") String tenantId,
                                   @Param("start") LocalDate start);

    void deleteByRollupDateBefore(LocalDate cutoff);

    void deleteByTenantIdAndRollupDateBefore(String tenantId, LocalDate cutoff);
}
