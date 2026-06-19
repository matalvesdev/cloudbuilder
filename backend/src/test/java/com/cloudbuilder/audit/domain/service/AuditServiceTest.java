package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditEventRepository repository;

    private AuditService auditService;

    @BeforeEach
    void setUp() {
        auditService = new AuditService(repository);
    }

    @Test
    void recordEvent_ShouldSaveAndReturn() {
        var event = new AuditEvent("tenant-1", "user-1", "CREATE",
                "PROJECT", "proj-1", "Details", "192.168.1.1");
        when(repository.save(any(AuditEvent.class))).thenReturn(event);

        var result = auditService.recordEvent("tenant-1", "user-1", "CREATE",
                "PROJECT", "proj-1", "Details", "192.168.1.1");

        assertNotNull(result);
        assertEquals("user-1", result.getUserId());
        assertEquals("CREATE", result.getAction());
        assertEquals("PROJECT", result.getResourceType());
        verify(repository).save(any(AuditEvent.class));
    }

    @Test
    void getEventsByTenant_ShouldReturnListOrderedByTimestampDesc() {
        var events = List.of(
                new AuditEvent("tenant-1", "user-1", "CREATE", "PROJECT", "p1", "d1", "ip1"),
                new AuditEvent("tenant-1", "user-2", "UPDATE", "PROJECT", "p1", "d2", "ip2")
        );
        when(repository.findByTenantIdOrderByTimestampDesc("tenant-1")).thenReturn(events);

        var result = auditService.getEventsByTenant("tenant-1");

        assertEquals(2, result.size());
        verify(repository).findByTenantIdOrderByTimestampDesc("tenant-1");
    }

    @Test
    void getEventsByTenant_WhenNoEvents_ShouldReturnEmpty() {
        when(repository.findByTenantIdOrderByTimestampDesc("tenant-empty")).thenReturn(List.of());

        var result = auditService.getEventsByTenant("tenant-empty");

        assertTrue(result.isEmpty());
    }

    @Test
    void getEventsByUser_ShouldReturnList() {
        var events = List.of(
                new AuditEvent("tenant-1", "user-1", "LOGIN", "SESSION", "s1", "", "ip1")
        );
        when(repository.findByUserId("user-1")).thenReturn(events);

        var result = auditService.getEventsByUser("user-1");

        assertEquals(1, result.size());
        assertEquals("LOGIN", result.getFirst().getAction());
        verify(repository).findByUserId("user-1");
    }

    @Test
    void getEventsByUser_WhenNoEvents_ShouldReturnEmpty() {
        when(repository.findByUserId("unknown")).thenReturn(List.of());

        var result = auditService.getEventsByUser("unknown");

        assertTrue(result.isEmpty());
    }
}
