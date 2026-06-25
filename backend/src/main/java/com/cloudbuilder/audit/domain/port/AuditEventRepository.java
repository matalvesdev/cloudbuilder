package com.cloudbuilder.audit.domain.port;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, String>,
                                              JpaSpecificationExecutor<AuditEvent> {
    List<AuditEvent> findByTenantIdOrderByTimestampDesc(String tenantId);
    List<AuditEvent> findByUserId(String userId);
    List<AuditEvent> findByAction(String action);

    List<AuditEvent> findByTenantIdAndTimestampBetween(
            String tenantId, Instant start, Instant end, Pageable pageable);

    long countByTenantIdAndTimestampBetween(
            String tenantId, Instant start, Instant end);
}
