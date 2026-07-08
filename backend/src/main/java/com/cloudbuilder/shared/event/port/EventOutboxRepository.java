package com.cloudbuilder.shared.event.port;

import com.cloudbuilder.shared.event.domain.EventOutboxEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface EventOutboxRepository extends JpaRepository<EventOutboxEntry, String> {

    List<EventOutboxEntry> findByStatusOrderByCreatedAtAsc(EventOutboxEntry.Status status);

    List<EventOutboxEntry> findByStatusAndRetryCountLessThanOrderByCreatedAtAsc(
            EventOutboxEntry.Status status, int maxRetries);

    @Modifying
    @Query("DELETE FROM EventOutboxEntry e WHERE e.status = :status AND e.processedAt < :cutoff")
    int deleteByStatusAndProcessedAtBefore(
            @Param("status") EventOutboxEntry.Status status,
            @Param("cutoff") Instant cutoff);

    long countByStatus(EventOutboxEntry.Status status);
}
