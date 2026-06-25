package com.cloudbuilder.analytics.domain.port;

import com.cloudbuilder.analytics.domain.model.AnalyticsUserRollupDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for daily user activity rollups.
 */
public interface AnalyticsUserRollupDailyRepository extends JpaRepository<AnalyticsUserRollupDaily, String> {

    List<AnalyticsUserRollupDaily> findByTenantIdAndRollupDateBetween(
        String tenantId, LocalDate start, LocalDate end);

    Optional<AnalyticsUserRollupDaily> findByTenantIdAndUserIdAndModuleAndRollupDate(
        String tenantId, String userId, String module, LocalDate rollupDate);

    @Query("SELECT r.userId, SUM(r.eventCount) FROM AnalyticsUserRollupDaily r " +
           "WHERE r.tenantId = :tenantId AND r.rollupDate >= :start " +
           "GROUP BY r.userId ORDER BY SUM(r.eventCount) DESC")
    List<Object[]> sumUserActivity(@Param("tenantId") String tenantId,
                                    @Param("start") LocalDate start);
}
