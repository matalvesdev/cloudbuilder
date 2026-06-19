package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.LogEntryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
@Repository
public interface LogEntryRepository extends JpaRepository<LogEntryEntity, String> {

    Page<LogEntryEntity> findByTenantIdAndTimestampBetweenOrderByTimestampDesc(
        String tenantId, Instant start, Instant end, Pageable pageable);

    Page<LogEntryEntity> findByTenantIdAndLevelAndTimestampBetweenOrderByTimestampDesc(
        String tenantId, String level, Instant start, Instant end, Pageable pageable);

    @Query(value = """
        SELECT * FROM logs
        WHERE tenant_id = :tenantId
          AND to_tsvector('portuguese', message) @@ plainto_tsquery('portuguese', :query)
          AND timestamp BETWEEN :start AND :end
        ORDER BY timestamp DESC
        LIMIT :limit
        """, nativeQuery = true)
    Page<LogEntryEntity> fullTextSearch(
        @Param("tenantId") String tenantId,
        @Param("query") String query,
        @Param("start") Instant start,
        @Param("end") Instant end,
        Pageable pageable);

    void deleteByTimestampBefore(Instant cutoff);
}
