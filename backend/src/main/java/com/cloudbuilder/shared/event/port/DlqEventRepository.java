package com.cloudbuilder.shared.event.port;

import com.cloudbuilder.shared.event.domain.DlqEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DlqEventRepository extends JpaRepository<DlqEvent, String> {
}
