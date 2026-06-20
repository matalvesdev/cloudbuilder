package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditQueryServiceTest {

    @Mock
    private AuditEventRepository repository;

    private AuditQueryService auditQueryService;

    @BeforeEach
    void setUp() {
        auditQueryService = new AuditQueryService(repository);
    }

    @Test
    void queryEvents_WithNoFilters_ShouldReturnAllEvents() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "Created canvas", "10.0.0.1"),
                new AuditEvent(tenantId, "user-2", "DELETE", "Budget", "res-2", "Deleted budget", "10.0.0.2"),
                new AuditEvent(tenantId, "user-1", "UPDATE", "Canvas", "res-3", "Updated canvas", "10.0.0.1"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        var result = auditQueryService.queryEvents(tenantId, null, null, null, null, null, 0, 20);

        assertEquals(3, result.size(), "All 3 events should be returned");
        verify(repository).findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class),
                any(Instant.class), any(Pageable.class));
    }

    @Test
    void queryEvents_WithUserIdFilter_ShouldFilterByUserId() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "", "10.0.0.1"),
                new AuditEvent(tenantId, "user-2", "DELETE", "Budget", "res-2", "", "10.0.0.2"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        var result = auditQueryService.queryEvents(tenantId, "user-2", null, null, null, null, 0, 20);

        assertEquals(1, result.size());
        assertEquals("user-2", result.get(0).getUserId());
    }

    @Test
    void queryEvents_WithActionFilter_ShouldFilterByAction() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "", "10.0.0.1"),
                new AuditEvent(tenantId, "user-2", "DELETE", "Budget", "res-2", "", "10.0.0.2"),
                new AuditEvent(tenantId, "user-3", "CREATE", "Canvas", "res-3", "", "10.0.0.3"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        var result = auditQueryService.queryEvents(tenantId, null, "CREATE", null, null, null, 0, 20);

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(e -> "CREATE".equals(e.getAction())));
    }

    @Test
    void queryEvents_WithResourceTypeFilter_ShouldFilterByResourceType() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "", "10.0.0.1"),
                new AuditEvent(tenantId, "user-2", "DELETE", "Budget", "res-2", "", "10.0.0.2"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        var result = auditQueryService.queryEvents(tenantId, null, null, "Canvas", null, null, 0, 20);

        assertEquals(1, result.size());
        assertEquals("Canvas", result.get(0).getResourceType());
    }

    @Test
    void queryEvents_WithMultipleFilters_ShouldApplyAll() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "", "10.0.0.1"),
                new AuditEvent(tenantId, "user-1", "DELETE", "Budget", "res-2", "", "10.0.0.2"),
                new AuditEvent(tenantId, "user-2", "CREATE", "Canvas", "res-3", "", "10.0.0.3"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        var result = auditQueryService.queryEvents(tenantId, "user-1", "CREATE", null, null, null, 0, 20);

        assertEquals(1, result.size());
        assertEquals("user-1", result.get(0).getUserId());
        assertEquals("CREATE", result.get(0).getAction());
    }

    @Test
    void queryEvents_WithDateRange_ShouldPassCorrectInstantRange() {
        var tenantId = "tenant-1";
        var startDate = LocalDate.of(2026, 6, 1);
        var endDate = LocalDate.of(2026, 6, 15);

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(List.of());

        auditQueryService.queryEvents(tenantId, null, null, null, startDate, endDate, 0, 20);

        var captor = ArgumentCaptor.forClass(Instant.class);
        verify(repository).findByTenantIdAndTimestampBetween(eq(tenantId), captor.capture(), captor.capture(),
                any(Pageable.class));

        var instants = captor.getAllValues();
        assertEquals(startDate.atStartOfDay(ZoneOffset.UTC).toInstant(), instants.get(0),
                "Start instant should be beginning of startDate");
        assertEquals(endDate.atTime(23, 59, 59, 999999999)
                .atZone(ZoneOffset.UTC).toInstant(), instants.get(1),
                "End instant should be end of endDate");
    }

    @Test
    void queryEvents_ResultsSortedByTimestampDesc() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "", "10.0.0.1"),
                new AuditEvent(tenantId, "user-1", "UPDATE", "Canvas", "res-2", "", "10.0.0.1"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        var result = auditQueryService.queryEvents(tenantId, null, null, null, null, null, 0, 20);

        assertEquals(2, result.size());
        // Should be sorted descending by timestamp
        assertTrue(result.get(0).getTimestamp().compareTo(result.get(1).getTimestamp()) >= 0);
    }

    @Test
    void countEvents_WithNoAdditionalFilters_ShouldUseRepositoryCount() {
        var tenantId = "tenant-1";

        when(repository.countByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class)))
                .thenReturn(5L);

        var count = auditQueryService.countEvents(tenantId, null, null, null, null, null);

        assertEquals(5L, count, "Should use repository count directly");
        verify(repository).countByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class));
        verify(repository, never()).findByTenantIdAndTimestampBetween(anyString(), any(), any(), any());
    }

    @Test
    void countEvents_WithAdditionalFilters_ShouldFetchAndFilter() {
        var tenantId = "tenant-1";

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "", "10.0.0.1"),
                new AuditEvent(tenantId, "user-2", "DELETE", "Budget", "res-2", "", "10.0.0.2")));

        var count = auditQueryService.countEvents(tenantId, "user-1", null, null, null, null);

        assertEquals(1L, count, "Should count only user-1 events after in-memory filtering");
        verify(repository).findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class));
    }
}
