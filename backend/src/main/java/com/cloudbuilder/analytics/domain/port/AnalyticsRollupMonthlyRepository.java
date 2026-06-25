package com.cloudbuilder.analytics.domain.port;

import com.cloudbuilder.analytics.domain.model.AnalyticsRollupMonthly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for monthly analytics rollups.
 */
public interface AnalyticsRollupMonthlyRepository extends JpaRepository<AnalyticsRollupMonthly, String> {

    List<AnalyticsRollupMonthly> findByTenantIdAndRollupMonthBetween(
        String tenantId, LocalDate start, LocalDate end);

    Optional<AnalyticsRollupMonthly> findByTenantIdAndModuleAndActionAndRollupMonth(
        String tenantId, String module, String action, LocalDate rollupMonth);

    @Query("SELECT r.module, SUM(r.eventCount) FROM AnalyticsRollupMonthly r " +
           "WHERE r.tenantId = :tenantId AND r.rollupMonth >= :start " +
           "GROUP BY r.module ORDER BY SUM(r.eventCount) DESC")
    List<Object[]> sumModuleUsageMonthly(@Param("tenantId") String tenantId,
                                          @Param("start") LocalDate start);

    void deleteByRollupMonthBefore(LocalDate cutoff);

    void deleteByTenantIdAndRollupMonthBefore(String tenantId, LocalDate cutoff);
}
