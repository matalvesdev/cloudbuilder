package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.MetricsTsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
@Repository
public interface MetricsTsRepository extends JpaRepository<MetricsTsEntity, String> {

    @Query(value = """
        SELECT * FROM metrics_ts
        WHERE tenant_id = :tenantId
          AND metric_name = :metricName
          AND timestamp BETWEEN :start AND :end
        ORDER BY timestamp ASC
        """, nativeQuery = true)
    List<MetricsTsEntity> findByTenantIdAndMetricNameAndTimeRange(
        @Param("tenantId") String tenantId,
        @Param("metricName") String metricName,
        @Param("start") Instant start,
        @Param("end") Instant end);

    @Query(value = """
        SELECT AVG(value) FROM metrics_ts
        WHERE tenant_id = :tenantId
          AND metric_name = :metricName
          AND timestamp BETWEEN :start AND :end
        """, nativeQuery = true)
    Double averageValue(@Param("tenantId") String tenantId,
                        @Param("metricName") String metricName,
                        @Param("start") Instant start,
                        @Param("end") Instant end);

    @Query(value = """
        SELECT PERCENTILE_CONT(:pct) WITHIN GROUP (ORDER BY value)
        FROM metrics_ts
        WHERE tenant_id = :tenantId
          AND metric_name = :metricName
          AND timestamp BETWEEN :start AND :end
        """, nativeQuery = true)
    Double percentile(@Param("tenantId") String tenantId,
                      @Param("metricName") String metricName,
                      @Param("start") Instant start,
                      @Param("end") Instant end,
                      @Param("pct") double pct);

    @Query(value = """
        SELECT SUM(value) FROM metrics_ts
        WHERE tenant_id = :tenantId
          AND metric_name = :metricName
          AND timestamp BETWEEN :start AND :end
        """, nativeQuery = true)
    Double sumValue(@Param("tenantId") String tenantId,
                    @Param("metricName") String metricName,
                    @Param("start") Instant start,
                    @Param("end") Instant end);

    void deleteByTimestampBefore(Instant cutoff);
}
