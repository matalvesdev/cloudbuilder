package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.SpanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface SpanRepository extends JpaRepository<SpanEntity, String> {

    List<SpanEntity> findByTraceIdOrderByStartTimeAsc(String traceId);
}
