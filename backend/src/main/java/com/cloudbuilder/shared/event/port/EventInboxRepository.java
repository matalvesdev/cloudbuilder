package com.cloudbuilder.shared.event.port;

import com.cloudbuilder.shared.event.domain.EventInbox;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventInboxRepository extends JpaRepository<EventInbox, String> {
}
