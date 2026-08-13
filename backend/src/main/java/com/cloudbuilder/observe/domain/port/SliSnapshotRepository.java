package com.cloudbuilder.observe.domain.port;

import com.cloudbuilder.observe.domain.model.SliSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface SliSnapshotRepository extends JpaRepository<SliSnapshot, String> {
    List<SliSnapshot> findBySloDefinitionIdOrderByMeasuredAtDesc(String sloDefinitionId);
    List<SliSnapshot> findBySloDefinitionIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            String sloDefinitionId, Instant start, Instant end);
    List<SliSnapshot> findByEnvironmentIdAndMeasuredAtAfterOrderByMeasuredAtDesc(
            String environmentId, Instant since);
}
