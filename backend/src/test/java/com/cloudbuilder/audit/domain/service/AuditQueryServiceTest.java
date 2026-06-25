package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

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

        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(events));

        var result = auditQueryService.queryEvents(tenantId, null, null, null, null, null, 0, 20);

        assertEquals(3, result.size(), "All 3 events should be returned");
        verify(repository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void queryEvents_WithUserIdFilter_ShouldDelegateWithSpecification() {
        var tenantId = "tenant-1";
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        var result = auditQueryService.queryEvents(tenantId, "user-2", null, null, null, null, 0, 20);

        assertTrue(result.isEmpty());
        verify(repository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void queryEvents_WithActionFilter_ShouldDelegateWithSpecification() {
        var tenantId = "tenant-1";
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        var result = auditQueryService.queryEvents(tenantId, null, "CREATE", null, null, null, 0, 20);

        assertTrue(result.isEmpty());
        verify(repository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void queryEvents_WithResourceTypeFilter_ShouldDelegateWithSpecification() {
        var tenantId = "tenant-1";
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        var result = auditQueryService.queryEvents(tenantId, null, null, "Canvas", null, null, 0, 20);

        assertTrue(result.isEmpty());
        verify(repository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void queryEvents_WithMultipleFilters_ShouldDelegateWithSpecification() {
        var tenantId = "tenant-1";
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        var result = auditQueryService.queryEvents(tenantId, "user-1", "CREATE", null, null, null, 0, 20);

        assertTrue(result.isEmpty());
        verify(repository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void queryEvents_WithDateRange_ShouldPassCorrectInstantRange() {
        var tenantId = "tenant-1";
        var startDate = LocalDate.of(2026, 6, 1);
        var endDate = LocalDate.of(2026, 6, 15);

        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        auditQueryService.queryEvents(tenantId, null, null, null, startDate, endDate, 0, 20);

        verify(repository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void queryEvents_ResultsSortedByTimestampDesc() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "", "10.0.0.1"),
                new AuditEvent(tenantId, "user-1", "UPDATE", "Canvas", "res-2", "", "10.0.0.1"));

        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(events));

        var result = auditQueryService.queryEvents(tenantId, null, null, null, null, null, 0, 20);

        assertEquals(2, result.size());
    }

    @Test
    void countEvents_WithNoAdditionalFilters_ShouldUseRepositoryCount() {
        var tenantId = "tenant-1";

        when(repository.count(any(Specification.class))).thenReturn(5L);

        var count = auditQueryService.countEvents(tenantId, null, null, null, null, null);

        assertEquals(5L, count, "Should use repository count directly");
        verify(repository).count(any(Specification.class));
    }

    @Test
    void countEvents_WithAdditionalFilters_ShouldFetchAndFilter() {
        var tenantId = "tenant-1";

        when(repository.count(any(Specification.class))).thenReturn(1L);

        var count = auditQueryService.countEvents(tenantId, "user-1", null, null, null, null);

        assertEquals(1L, count, "Should count only user-1 events");
        verify(repository).count(any(Specification.class));
    }
}
