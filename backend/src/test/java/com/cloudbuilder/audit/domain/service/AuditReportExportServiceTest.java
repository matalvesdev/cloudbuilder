package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditReportExportServiceTest {

    @Mock
    private AuditEventRepository repository;

    private AuditReportExportService exportService;

    @BeforeEach
    void setUp() {
        exportService = new AuditReportExportService(repository);
    }

    @Test
    void exportCsv_WithEvents_ShouldGenerateCsv() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "Created canvas", "10.0.0.1"),
                new AuditEvent(tenantId, "user-2", "DELETE", "Budget", "res-2", "Deleted budget", "10.0.0.2"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        var csv = exportService.exportCsv(tenantId, null, null, null, null);

        assertNotNull(csv);
        assertTrue(csv.startsWith("id,tenantId,userId,action,resourceType,resourceId,details,ipAddress,timestamp"),
                "CSV should start with header row");

        var lines = csv.split("\n");
        assertEquals(3, lines.length, "Header + 2 data rows");

        // Verify second row contains tenant-1 and user-1
        assertTrue(lines[1].contains("tenant-1"), "First data row should contain tenant-1");
        assertTrue(lines[1].contains("user-1"), "First data row should contain user-1");
        assertTrue(lines[1].contains("CREATE"), "First data row should contain CREATE");
    }

    @Test
    void exportCsv_WithNullFields_ShouldHandleGracefully() {
        var tenantId = "tenant-1";
        var event = new AuditEvent(tenantId, "user-1", "VIEW", "Canvas", "res-1", null, null);

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(List.of(event));

        var csv = exportService.exportCsv(tenantId, null, null, null, null);

        // Null fields should appear as empty strings
        assertTrue(csv.contains(",,"), "Null fields should become empty in CSV");
    }

    @Test
    void exportCsv_WithSpecialChars_ShouldEscape() {
        var tenantId = "tenant-1";
        var event = new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1",
                "Details with, commas and \"quotes\" and\nnewlines", "10.0.0.1");

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(List.of(event));

        var csv = exportService.exportCsv(tenantId, null, null, null, null);

        // Commas/content requiring quoting should be wrapped in double quotes
        assertTrue(csv.contains("\""), "Special characters should trigger CSV quoting");
        assertTrue(csv.contains("Details with, commas and \"\"quotes\"\" and"), "Commas and quotes should be escaped");
    }

    @Test
    void exportCsv_WithNoEvents_ShouldReturnHeaderOnly() {
        var tenantId = "tenant-1";

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(List.of());

        var csv = exportService.exportCsv(tenantId, null, null, null, null);

        var lines = csv.split("\n");
        assertEquals(1, lines.length, "Should only have header row");
        assertTrue(lines[0].startsWith("id,"), "Should start with header");
    }

    @Test
    void exportJson_WithEvents_ShouldGenerateJson() throws Exception {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "Created", "10.0.0.1"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        var json = exportService.exportJson(tenantId, null, null, null, null);

        assertNotNull(json);
        assertTrue(json.contains("tenantId"), "JSON should contain tenantId field");
        assertTrue(json.contains("user-1"), "JSON should contain user-1");
        assertTrue(json.contains("CREATE"), "JSON should contain CREATE action");
    }

    @Test
    void exportJson_WithNoEvents_ShouldReturnEmptyArray() throws Exception {
        var tenantId = "tenant-1";

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(List.of());

        var json = exportService.exportJson(tenantId, null, null, null, null);

        assertNotNull(json);
        // Should be an empty JSON array
        assertTrue(json.contains("[") && json.contains("]"),
                "Empty export should be a JSON array: " + json);
    }

    @Test
    void export_FiltersByUserIdAndAction() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "", "10.0.0.1"),
                new AuditEvent(tenantId, "user-2", "DELETE", "Budget", "res-2", "", "10.0.0.2"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        // Export only user-1 events
        var csv = exportService.exportCsv(tenantId, "user-1", null, null, null);

        var lines = csv.split("\n");
        assertEquals(2, lines.length, "Header + 1 filtered data row");
        assertTrue(lines[1].contains("user-1"), "Filtered CSV should only contain user-1");
        assertFalse(lines[1].contains("user-2"), "Filtered CSV should NOT contain user-2");
    }

    @Test
    void exportCsv_WithActionFilter_ShouldFilterByAction() {
        var tenantId = "tenant-1";
        var events = List.of(
                new AuditEvent(tenantId, "user-1", "CREATE", "Canvas", "res-1", "", "10.0.0.1"),
                new AuditEvent(tenantId, "user-2", "DELETE", "Budget", "res-2", "", "10.0.0.2"));

        when(repository.findByTenantIdAndTimestampBetween(eq(tenantId), any(Instant.class), any(Instant.class),
                any(Pageable.class))).thenReturn(events);

        var csv = exportService.exportCsv(tenantId, null, "DELETE", null, null);

        var lines = csv.split("\n");
        assertEquals(2, lines.length, "Header + 1 filtered data row");
        assertTrue(lines[1].contains("DELETE"), "Filtered CSV should contain DELETE action");
    }
}
