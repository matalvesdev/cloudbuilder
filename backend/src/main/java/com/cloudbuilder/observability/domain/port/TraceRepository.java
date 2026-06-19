package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.TraceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
@Repository
public interface TraceRepository extends JpaRepository<TraceEntity, String> {

    Optional<TraceEntity> findByTraceId(String traceId);

    List<TraceEntity> findByTenantIdAndStartTimeBetweenOrderByStartTimeDesc(
        String tenantId, Instant start, Instant end);

    List<TraceEntity> findByTenantIdAndIsErrorTrueOrderByStartTimeDesc(String tenantId);

    void deleteByStartTimeBefore(Instant cutoff);
}
