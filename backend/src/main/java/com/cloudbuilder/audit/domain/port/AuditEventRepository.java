package com.cloudbuilder.audit.domain.port;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
    List<AuditEvent> findByTenantIdOrderByTimestampDesc(String tenantId);
    List<AuditEvent> findByUserId(String userId);
    List<AuditEvent> findByAction(String action);
}
