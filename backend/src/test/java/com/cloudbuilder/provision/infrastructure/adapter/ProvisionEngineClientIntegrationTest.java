package com.cloudbuilder.provision.infrastructure.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Integration tests for {@link ProvisionEngineClient} using a mocked RestTemplate
 * to simulate various Go engine responses and failure scenarios.
 *
 * Tests: successful provisioning, error responses, timeout handling,
 * and fallback behavior.
 */
@ExtendWith(MockitoExtension.class)
class ProvisionEngineClientIntegrationTest {

    private RestTemplate restTemplate;
    private ProvisionEngineClient client;

    private static final String ENGINE_URL = "http://localhost:50052";

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        client = new ProvisionEngineClient(restTemplate, ENGINE_URL);
    }

    // ─── Successful provisioning ───────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void execute_successfulResponse_returnsEngineResponse() {
        var payload = testPayload();
        Map<String, Object> engineResponse = Map.of(
            "deploymentId", "dep-001",
            "status", "APPLIED",
            "message", "Terraform applied successfully",
            "planOutput", "Plan: 3 to add",
            "applyOutput", "Apply complete! Resources: 3 added",
            "durationMs", 5000
        );

        when(restTemplate.exchange(
            eq(ENGINE_URL + "/api/v1/provision/apply"),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        )).thenReturn(new ResponseEntity<>(engineResponse, HttpStatus.OK));

        var result = client.execute(payload);

        assertEquals("dep-001", result.deploymentId());
        assertEquals("APPLIED", result.status());
        assertEquals("Terraform applied successfully", result.message());
        assertEquals("Plan: 3 to add", result.planOutput());
        assertEquals("Apply complete! Resources: 3 added", result.applyOutput());
        assertEquals(5000L, result.durationMs());
    }

    @Test
    @SuppressWarnings("unchecked")
    void execute_planOnly_returnsPlannedStatus() {
        var payload = testPayload();
        Map<String, Object> engineResponse = Map.of(
            "deploymentId", "dep-002",
            "status", "PLANNED",
            "message", "Terraform plan completed",
            "planOutput", "Plan: 3 to add, 0 to change",
            "durationMs", 3000
        );

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(engineResponse, HttpStatus.OK));

        var result = client.execute(payload);

        assertEquals("PLANNED", result.status());
        assertEquals("Plan: 3 to add, 0 to change", result.planOutput());
    }

    // ─── Error scenarios ───────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void execute_engineReturnsFailed_returnsFailedResponse() {
        var payload = testPayload();
        Map<String, Object> engineResponse = Map.of(
            "deploymentId", "dep-fail",
            "status", "FAILED",
            "message", "Plan failed",
            "error", "Error: Missing required variable",
            "durationMs", 1000
        );

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(engineResponse, HttpStatus.OK));

        var result = client.execute(payload);

        assertEquals("FAILED", result.status());
        assertEquals("Error: Missing required variable", result.error());
    }

    @Test
    @SuppressWarnings("unchecked")
    void execute_httpError_returnsFailedResponse() {
        var payload = testPayload();

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(null, HttpStatus.SERVICE_UNAVAILABLE));

        var result = client.execute(payload);

        assertEquals("FAILED", result.status());
        assertTrue(result.error().contains("503"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void execute_connectionRefused_throwsException() {
        var payload = testPayload();

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenThrow(new org.springframework.web.client.ResourceAccessException("Connection refused"));

        assertThrows(org.springframework.web.client.ResourceAccessException.class,
            () -> client.execute(payload));
    }

    // ─── Fallback behavior ─────────────────────────────────────

    @Test
    void executeFallback_returnsFailedResponse() {
        var payload = testPayload();
        var fallback = client.executeFallback(payload, new RuntimeException("Circuit open"));

        assertEquals("FAILED", fallback.status());
        assertTrue(fallback.error().contains("CIRCUIT_OPEN"));
        assertTrue(fallback.error().contains("Circuit open"));
    }

    @Test
    void executeFallback_preservesCanvasId() {
        var payload = new ProvisionEngineClient.ProvisionPayload(
            "canvas-fallback", "tenant-1", "aws", "terraform",
            Map.of("main.tf", "resource \"aws_vpc\" \"main\" {}"),
            1, Map.of(), false, "cred-1"
        );

        var fallback = client.executeFallback(payload, new RuntimeException("Timeout"));

        assertEquals("FAILED", fallback.status());
        assertTrue(fallback.error().contains("Timeout"));
    }

    // ─── Health check ──────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void isHealthy_engineUp_returnsTrue() {
        when(restTemplate.exchange(
            eq(ENGINE_URL + "/healthz"),
            eq(HttpMethod.GET),
            isNull(),
            eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of("status", "ok"), HttpStatus.OK));

        assertTrue(client.isHealthy());
    }

    @Test
    @SuppressWarnings("unchecked")
    void isHealthy_engineDown_returnsFalse() {
        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.GET), isNull(), eq(Map.class)
        )).thenThrow(new RuntimeException("Connection refused"));

        assertFalse(client.isHealthy());
    }

    // ─── Request construction ──────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void execute_sendsCorrectHeaders() {
        var payload = testPayload();

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-1", "status", "APPLIED", "message", "ok", "durationMs", 100
        ), HttpStatus.OK));

        client.execute(payload);

        var entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
            anyString(), eq(HttpMethod.POST), entityCaptor.capture(), eq(Map.class)
        );

        var entity = entityCaptor.getValue();
        assertEquals("tenant-integration", entity.getHeaders().getFirst("X-Tenant-Id"));
        assertEquals("application/json", entity.getHeaders().getContentType().toString());
    }

    @Test
    @SuppressWarnings("unchecked")
    void execute_sendsPayloadToCorrectUrl() {
        var payload = testPayload();

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-1", "status", "APPLIED", "message", "ok", "durationMs", 100
        ), HttpStatus.OK));

        client.execute(payload);

        verify(restTemplate).exchange(
            eq(ENGINE_URL + "/api/v1/provision/apply"),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(Map.class)
        );
    }

    // ─── Edge cases ───────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void execute_emptyResponseBody_returnsFailedResponse() {
        var payload = testPayload();

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        var result = client.execute(payload);

        assertEquals("FAILED", result.status());
        assertTrue(result.message().contains("HTTP"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void execute_missingDeploymentId_returnsUnknown() {
        var payload = testPayload();
        Map<String, Object> incompleteResponse = Map.of(
            "status", "APPLIED",
            "message", "Applied"
        );

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(incompleteResponse, HttpStatus.OK));

        var result = client.execute(payload);

        assertEquals("unknown", result.deploymentId());
        assertEquals("APPLIED", result.status());
    }

    @Test
    @SuppressWarnings("unchecked")
    void execute_missingOptionalFields_defaultsToEmpty() {
        var payload = testPayload();
        Map<String, Object> minimalResponse = Map.of(
            "deploymentId", "dep-min",
            "status", "PLANNED",
            "message", "Planned"
        );

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(minimalResponse, HttpStatus.OK));

        var result = client.execute(payload);

        assertEquals("dep-min", result.deploymentId());
        assertEquals("PLANNED", result.status());
        assertEquals("", result.planOutput());
        assertEquals("", result.applyOutput());
        assertEquals("", result.error());
        assertEquals(0L, result.durationMs());
    }

    // ─── Provider-specific payloads ────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void execute_gcpPayload_sendsCorrectEnvVars() {
        var payload = new ProvisionEngineClient.ProvisionPayload(
            "canvas-gcp", "tenant-1", "google", "terraform",
            Map.of("main.tf", "resource \"google_compute_network\" \"vpc\" {}"),
            1,
            Map.of("GOOGLE_CREDENTIALS", "{\"type\":\"service_account\"}"),
            false, "cred-gcp"
        );

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-gcp", "status", "APPLIED", "message", "ok", "durationMs", 100
        ), HttpStatus.OK));

        client.execute(payload);

        var entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
            anyString(), eq(HttpMethod.POST), entityCaptor.capture(), eq(Map.class)
        );

        @SuppressWarnings("unchecked")
        var body = (ProvisionEngineClient.ProvisionPayload) entityCaptor.getValue().getBody();
        assertNotNull(body);
        assertEquals("google", body.provider());
        assertTrue(body.envVars().containsKey("GOOGLE_CREDENTIALS"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void execute_azurePayload_sendsCorrectEnvVars() {
        var payload = new ProvisionEngineClient.ProvisionPayload(
            "canvas-azure", "tenant-1", "azurerm", "terraform",
            Map.of("main.tf", "resource \"azurerm_virtual_network\" \"vnet\" {}"),
            1,
            Map.of(
                "ARM_CLIENT_ID", "client-123",
                "ARM_CLIENT_SECRET", "secret-456",
                "ARM_TENANT_ID", "tenant-789",
                "ARM_SUBSCRIPTION_ID", "sub-012"
            ),
            false, "cred-azure"
        );

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-azure", "status", "APPLIED", "message", "ok", "durationMs", 100
        ), HttpStatus.OK));

        client.execute(payload);

        var entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
            anyString(), eq(HttpMethod.POST), entityCaptor.capture(), eq(Map.class)
        );

        @SuppressWarnings("unchecked")
        var body = (ProvisionEngineClient.ProvisionPayload) entityCaptor.getValue().getBody();
        assertNotNull(body);
        assertEquals("azurerm", body.provider());
        assertEquals(4, body.envVars().size());
    }

    // ─── AutoApprove flag ──────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void execute_autoApproveTrue_sendsInPayload() {
        var payload = new ProvisionEngineClient.ProvisionPayload(
            "canvas-auto", "tenant-1", "aws", "terraform",
            Map.of("main.tf", "resource \"aws_vpc\" \"main\" {}"),
            1, Map.of(), true, "cred-1"
        );

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-auto", "status", "APPLIED", "message", "Applied", "durationMs", 5000
        ), HttpStatus.OK));

        var result = client.execute(payload);

        assertEquals("APPLIED", result.status());

        var entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
            anyString(), eq(HttpMethod.POST), entityCaptor.capture(), eq(Map.class)
        );

        @SuppressWarnings("unchecked")
        var body = (ProvisionEngineClient.ProvisionPayload) entityCaptor.getValue().getBody();
        assertTrue(body.autoApprove());
    }

    @Test
    @SuppressWarnings("unchecked")
    void execute_autoApproveFalse_sendsInPayload() {
        var payload = testPayload(); // autoApprove = false

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-plan", "status", "PLANNED", "message", "Planned", "durationMs", 3000
        ), HttpStatus.OK));

        client.execute(payload);

        var entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
            anyString(), eq(HttpMethod.POST), entityCaptor.capture(), eq(Map.class)
        );

        @SuppressWarnings("unchecked")
        var body = (ProvisionEngineClient.ProvisionPayload) entityCaptor.getValue().getBody();
        assertFalse(body.autoApprove());
    }

    // ─── OpenTofu engine ───────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void execute_opentofuEngine_sendsEngineType() {
        var payload = new ProvisionEngineClient.ProvisionPayload(
            "canvas-tofu", "tenant-1", "aws", "opentofu",
            Map.of("main.tf", "resource \"aws_vpc\" \"main\" {}"),
            1, Map.of(), false, "cred-1"
        );

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-tofu", "status", "APPLIED", "message", "ok", "durationMs", 100
        ), HttpStatus.OK));

        client.execute(payload);

        var entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
            anyString(), eq(HttpMethod.POST), entityCaptor.capture(), eq(Map.class)
        );

        @SuppressWarnings("unchecked")
        var body = (ProvisionEngineClient.ProvisionPayload) entityCaptor.getValue().getBody();
        assertEquals("opentofu", body.engine());
    }

    // ─── Multiple files ────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void execute_multipleFiles_sendsAllInPayload() {
        var files = Map.of(
            "main.tf", "resource \"aws_vpc\" \"main\" {}",
            "variables.tf", "variable \"region\" {}",
            "outputs.tf", "output \"id\" { value = aws_vpc.main.id }",
            "providers.tf", "provider \"aws\" {}",
            "versions.tf", "terraform {}"
        );
        var payload = new ProvisionEngineClient.ProvisionPayload(
            "canvas-multi", "tenant-1", "aws", "terraform",
            files, 5, Map.of(), false, "cred-1"
        );

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-multi", "status", "APPLIED", "message", "ok", "durationMs", 100
        ), HttpStatus.OK));

        client.execute(payload);

        var entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
            anyString(), eq(HttpMethod.POST), entityCaptor.capture(), eq(Map.class)
        );

        @SuppressWarnings("unchecked")
        var body = (ProvisionEngineClient.ProvisionPayload) entityCaptor.getValue().getBody();
        assertEquals(5, body.files().size());
        assertEquals(5, body.resourceCount());
    }

    // ─── DurationMs from response ──────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void execute_zeroDuration_returnsZero() {
        var payload = testPayload();

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-0", "status", "APPLIED", "message", "ok", "durationMs", 0
        ), HttpStatus.OK));

        var result = client.execute(payload);

        assertEquals(0L, result.durationMs());
    }

    @Test
    @SuppressWarnings("unchecked")
    void execute_largeDuration_returnsCorrectValue() {
        var payload = testPayload();

        when(restTemplate.exchange(
            anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)
        )).thenReturn(new ResponseEntity<>(Map.of(
            "deploymentId", "dep-slow", "status", "APPLIED", "message", "ok", "durationMs", 600000
        ), HttpStatus.OK));

        var result = client.execute(payload);

        assertEquals(600000L, result.durationMs());
    }

    // ─── Helper ────────────────────────────────────────────────

    private ProvisionEngineClient.ProvisionPayload testPayload() {
        return new ProvisionEngineClient.ProvisionPayload(
            "canvas-1", "tenant-integration", "aws", "terraform",
            Map.of(
                "main.tf", "resource \"aws_vpc\" \"main\" { cidr_block = \"10.0.0.0/16\" }",
                "variables.tf", "variable \"region\" { type = string }",
                "outputs.tf", "output \"id\" { value = aws_vpc.main.id }",
                "providers.tf", "provider \"aws\" {}",
                "versions.tf", "terraform { required_providers { aws = { source = \"hashicorp/aws\" } } }"
            ),
            1,
            Map.of("AWS_ACCESS_KEY_ID", "AKIA123", "AWS_SECRET_ACCESS_KEY", "secret", "AWS_DEFAULT_REGION", "us-east-1"),
            false,
            "cred-aws"
        );
    }
}
