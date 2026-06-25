package com.cloudbuilder.analytics.domain.port;

import com.cloudbuilder.analytics.domain.model.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, String> {

    List<AnalyticsEvent> findByTenantIdOrderByTimestampDesc(String tenantId);

    List<AnalyticsEvent> findByTenantIdAndModuleOrderByTimestampDesc(String tenantId, String module);

    List<AnalyticsEvent> findByTenantIdAndTimestampBetweenOrderByTimestampDesc(
            String tenantId, Instant start, Instant end);

    List<AnalyticsEvent> findByTenantIdInAndTimestampBetweenOrderByTimestampDesc(
            List<String> tenantIds, Instant start, Instant end);

    @Query("SELECT DISTINCT a.tenantId FROM AnalyticsEvent a")
    List<String> findDistinctTenantIds();

    long countByTenantIdAndModuleAndTimestampBetween(
            String tenantId, String module, Instant start, Instant end);

    @Query("SELECT a.module, COUNT(a) FROM AnalyticsEvent a WHERE a.tenantId = :tenantId " +
           "AND a.timestamp BETWEEN :start AND :end GROUP BY a.module ORDER BY COUNT(a) DESC")
    List<Object[]> countByModule(@Param("tenantId") String tenantId,
                                  @Param("start") Instant start,
                                  @Param("end") Instant end);

    @Query("SELECT a.userId, COUNT(a) FROM AnalyticsEvent a WHERE a.tenantId = :tenantId " +
           "AND a.timestamp BETWEEN :start AND :end GROUP BY a.userId ORDER BY COUNT(a) DESC")
    List<Object[]> countByUser(@Param("tenantId") String tenantId,
                                @Param("start") Instant start,
                                @Param("end") Instant end);
}
