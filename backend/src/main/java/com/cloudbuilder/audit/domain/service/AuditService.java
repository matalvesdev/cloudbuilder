package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AuditService {

    private final AuditEventRepository repository;

    public AuditService(AuditEventRepository repository) {
        this.repository = repository;
    }

    public AuditEvent recordEvent(String tenantId, String userId, String action,
                                  String resourceType, String resourceId,
                                  String details, String ipAddress) {
        var event = new AuditEvent(tenantId, userId, action, resourceType, resourceId, details, ipAddress);
        return repository.save(event);
    }

    @Transactional(readOnly = true)
    public List<AuditEvent> getEventsByTenant(String tenantId) {
        return repository.findByTenantIdOrderByTimestampDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public List<AuditEvent> getEventsByUser(String userId) {
        return repository.findByUserId(userId);
    }
}
