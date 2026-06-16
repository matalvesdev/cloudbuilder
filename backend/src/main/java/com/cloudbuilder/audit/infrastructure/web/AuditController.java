package com.cloudbuilder.audit.infrastructure.web;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.service.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@PreAuthorize("isAuthenticated()")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/events/{tenantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditEvent>> getEvents(@PathVariable String tenantId) {
        return ResponseEntity.ok(auditService.getEventsByTenant(tenantId));
    }

    @PostMapping("/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuditEvent> recordEvent(@RequestBody RecordEventRequest req) {
        var event = auditService.recordEvent(
                req.tenantId(), req.userId(), req.action(),
                req.resourceType(), req.resourceId(),
                req.details(), req.ipAddress());
        return ResponseEntity.status(HttpStatus.CREATED).body(event);
    }

    record RecordEventRequest(String tenantId, String userId, String action,
                              String resourceType, String resourceId,
                              String details, String ipAddress) {}
}
