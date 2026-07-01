package com.cloudbuilder.shared.event.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

/**
 * Repository for the event inbox (Inbox Pattern — ADR-035).
 */
@Repository
public interface EventInboxRepository extends JpaRepository<EventInbox, String> {

    boolean existsByEventId(String eventId);

    @Modifying
    @Query("DELETE FROM EventInbox e WHERE e.processedAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") Instant cutoff);
}
