package com.cloudbuilder.shared.event.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Dead Letter Queue events (ADR-035).
 */
@Repository
public interface DlqEventRepository extends JpaRepository<DlqEvent, String> {
}
