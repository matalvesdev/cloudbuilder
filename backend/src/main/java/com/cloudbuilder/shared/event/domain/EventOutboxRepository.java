package com.cloudbuilder.shared.event.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for the transactional outbox.
 * Query methods optimized for the OutboxSweeper sweep cycle.
 */
@Repository
public interface EventOutboxRepository extends JpaRepository<EventOutbox, String> {

    /**
     * Find pending events that need to be processed, oldest first.
     * Used by the scheduled OutboxSweeper for retries.
     */
    @Query("SELECT e FROM EventOutbox e WHERE e.status = 'PENDING' ORDER BY e.createdAt ASC")
    List<EventOutbox> findPendingOrderByCreatedAt();

    /**
     * Delete processed events older than the given cutoff.
     * Run periodically to prevent unbounded outbox table growth.
     */
    @Modifying
    @Query("DELETE FROM EventOutbox e WHERE e.status = 'PUBLISHED' AND e.processedAt < :cutoff")
    int deleteProcessedOlderThan(@Param("cutoff") Instant cutoff);

    /**
     * Count pending entries (for monitoring / health check).
     */
    long countByStatus(EventOutbox.Status status);
}
