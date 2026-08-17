package com.cloudbuilder.audit.infrastructure.web;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.service.AuditQueryService;
import com.cloudbuilder.audit.domain.service.AuditReportExportService;
import com.cloudbuilder.audit.domain.service.AuditService;
import com.cloudbuilder.audit.domain.service.ComplianceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditController Tests")
class AuditControllerTest {

    @Mock
    private AuditService auditService;
    @Mock
    private AuditQueryService auditQueryService;
    @Mock
    private AuditReportExportService auditReportExportService;
    @Mock
    private ComplianceService complianceService;

    @InjectMocks
    private AuditController auditController;

    @Test
    @DisplayName("GET /audit/events - returns events")
    void getEvents() {
        when(auditService.getEventsByTenant("tenant-1")).thenReturn(List.of());

        var response = auditController.getEvents("tenant-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("POST /audit/events - records event")
    void recordEvent() {
        var req = new AuditController.RecordEventRequest(
            "tenant-1", "user-1", "LOGIN", "USER", "user-1", "test", "127.0.0.1");
        when(auditService.recordEvent(any(), any(), any(), any(), any(), any(), any()))
            .thenAnswer(inv -> new AuditEvent(
                inv.getArgument(0), inv.getArgument(1), inv.getArgument(2),
                inv.getArgument(3), inv.getArgument(4), inv.getArgument(5), inv.getArgument(6)));

        var response = auditController.recordEvent(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("GET /audit/query - queries events")
    void queryEvents() {
        when(auditQueryService.queryEvents(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
            .thenReturn(List.of());

        var response = auditController.queryEvents("tenant-1", null, null, null, null, null, 0, 20);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("GET /audit/export/csv - exports CSV")
    void exportCsv() {
        when(auditReportExportService.exportCsv(any(), any(), any(), any(), any())).thenReturn("csv,data");

        var response = auditController.exportCsv("tenant-1", null, null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo("csv,data");
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
            .contains("audit-report.csv");
    }

    @Test
    @DisplayName("GET /audit/compliance/score - returns score with 100% when no rules")
    void getComplianceScore() {
        when(complianceService.evaluateAll("tenant-1")).thenReturn(List.of());

        var response = auditController.getComplianceScore("tenant-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("score");
        assertThat(response.getBody().get("score")).isEqualTo(100.0);
    }

    @Test
    @DisplayName("GET /audit/compliance/evaluations - returns evaluations")
    void getEvaluations() {
        when(complianceService.evaluateAll("tenant-1")).thenReturn(List.of());

        var response = auditController.getEvaluations("tenant-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("GET /audit/compliance/rules - lists rules")
    void getRules() {
        when(complianceService.getRulesByTenant("tenant-1")).thenReturn(List.of());

        var response = auditController.getRules("tenant-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("DELETE /audit/compliance/rules/{id} - deletes rule")
    void deleteRule() {
        var response = auditController.deleteRule("rule-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(complianceService).deleteRule("rule-1");
    }
}
