package com.cloudbuilder.approval.infrastructure.web;

import com.cloudbuilder.approval.domain.model.ApprovalRequest;
import com.cloudbuilder.approval.domain.service.ApprovalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalController Tests")
class ApprovalControllerTest {

    @Mock
    private ApprovalService approvalService;

    @InjectMocks
    private ApprovalController approvalController;

    @Test
    @DisplayName("GET /approval/rules - lists rules")
    void listRules() {
        when(approvalService.listRules("tenant-1")).thenReturn(List.of());

        var response = approvalController.listRules("tenant-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("DELETE /approval/rules/{id} - deletes rule")
    void deleteRule() {
        var response = approvalController.deleteRule("rule-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(approvalService).deleteRule("rule-1");
    }

    @Test
    @DisplayName("GET /approval/requests - lists requests")
    void listRequests() {
        when(approvalService.listRequestsByEnvironment("env-1")).thenReturn(List.of());

        var response = approvalController.listRequests("env-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("GET /approval/requests/{id} - gets request")
    void getRequest() {
        ApprovalRequest request = new ApprovalRequest(
            "tenant-1", "env-1", ApprovalRequest.RequestType.DEPLOY, "user-1");
        when(approvalService.findRequestById("req-1")).thenReturn(Optional.of(request));
        when(approvalService.getVotesForRequest(any())).thenReturn(List.of());

        var response = approvalController.getRequest("req-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("GET /approval/requests/{id} - returns 404 when not found")
    void getRequestNotFound() {
        when(approvalService.findRequestById("nonexistent")).thenReturn(Optional.empty());

        var response = approvalController.getRequest("nonexistent");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
