package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.credential.domain.model.Credential;
import com.cloudbuilder.credential.domain.service.CredentialService;
import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.application.dto.CanvasDesign.DesignEdge;
import com.cloudbuilder.provision.application.dto.CanvasDesign.DesignNode;
import com.cloudbuilder.provision.application.dto.GeneratedCode;
import com.cloudbuilder.provision.application.port.CanvasDesignFetcher;
import com.cloudbuilder.provision.domain.service.CodeGeneratorService;
import com.cloudbuilder.provision.domain.port.TerraformTemplateRepository;
import com.cloudbuilder.provision.infrastructure.adapter.ProvisionEngineClient;
import com.cloudbuilder.shared.security.TenantContext;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Integration tests for the complete provisioning flow.
 *
 * Tests the real CodeGeneratorService (no mock) with mocked external
 * dependencies (CanvasDesignFetcher, CredentialService, ProvisionEngineClient).
 *
 * Covers: code generation, credential injection, engine communication,
 * error handling, and edge cases across all providers.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProvisionFlowIntegrationTest {

    @Mock
    private CanvasDesignFetcher canvasDesignFetcher;
    @Mock
    private CredentialService credentialService;
    @Mock
    private TerraformTemplateRepository templateRepository;
    @Mock
    private ProvisionEngineClient engineClient;

    private CodeGeneratorService codeGeneratorService;
    private ProvisionController controller;

    private static final ProvisionEngineClient.EngineResponse SUCCESS =
        new ProvisionEngineClient.EngineResponse("dep-1", "APPLIED", "Applied", "Plan", "Apply", "", 5000L);

    private static final ProvisionEngineClient.EngineResponse PLAN_ONLY =
        new ProvisionEngineClient.EngineResponse("dep-2", "PLANNED", "Planned", "Plan output", "", "", 3000L);

    private static final ProvisionEngineClient.EngineResponse ENGINE_ERROR =
        new ProvisionEngineClient.EngineResponse("dep-3", "FAILED", "Engine error", "", "", "Connection refused", 0L);

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId("tenant-integration");
        codeGeneratorService = new CodeGeneratorService(templateRepository);
        controller = new ProvisionController(canvasDesignFetcher, codeGeneratorService, credentialService, engineClient);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ─── Full Flow: GCP ───────────────────────────────────────

    @Nested
    @DisplayName("GCP: Full provisioning flow")
    class GcpFlow {

        @Test
        @DisplayName("generates valid Terraform and forwards to engine")
        void gcpFlow_producesCorrectPayload() {
            var design = gcpDesign();
            var cred = gcpCredential();
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-gcp")).thenReturn(design);
            when(credentialService.findById("cred-gcp")).thenReturn(Optional.of(cred));
            when(engineClient.execute(any())).thenReturn(SUCCESS);

            var response = controller.provisionApply("canvas-gcp",
                new ProvisionController.ProvisionRequest("cred-gcp", "terraform", false));

            assertEquals(200, response.getStatusCodeValue());
            assertEquals("APPLIED", response.getBody().get("status"));

            var captor = ArgumentCaptor.forClass(ProvisionEngineClient.ProvisionPayload.class);
            verify(engineClient).execute(captor.capture());
            var payload = captor.getValue();

            // Provider detection
            assertEquals("google", payload.provider());
            assertEquals(4, payload.resourceCount());

            // Code generation — all 5 files
            var files = payload.files();
            assertEquals(5, files.size(), "Should generate 5 Terraform files");
            assertTrue(files.containsKey("main.tf"));
            assertTrue(files.containsKey("variables.tf"));
            assertTrue(files.containsKey("outputs.tf"));
            assertTrue(files.containsKey("providers.tf"));
            assertTrue(files.containsKey("versions.tf"));

            // Resource types in main.tf
            String mainTf = files.get("main.tf");
            assertTrue(mainTf.contains("google_compute_network"));
            assertTrue(mainTf.contains("google_compute_subnetwork"));
            assertTrue(mainTf.contains("google_compute_instance"));
            assertTrue(mainTf.contains("google_sql_database_instance"));

            // versions.tf uses correct provider source
            assertTrue(files.get("versions.tf").contains("hashicorp/google"));

            // Credential injection
            assertEquals("google", payload.envVars().get("GOOGLE_CREDENTIALS").contains("service_account") ? "google" : "missing");
            assertTrue(payload.envVars().containsKey("GOOGLE_CREDENTIALS"));
        }

        @Test
        @DisplayName("OpenTofu engine uses opentofu provider source")
        void gcpOpenTofu_usesCorrectSource() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-gcp")).thenReturn(gcpDesign());
            when(credentialService.findById("cred-gcp")).thenReturn(Optional.of(gcpCredential()));
            when(engineClient.execute(any())).thenReturn(SUCCESS);

            var response = controller.provisionApply("canvas-gcp",
                new ProvisionController.ProvisionRequest("cred-gcp", "opentofu", true));

            var captor = ArgumentCaptor.forClass(ProvisionEngineClient.ProvisionPayload.class);
            verify(engineClient).execute(captor.capture());
            var payload = captor.getValue();

            assertEquals("opentofu", payload.engine());
            assertTrue(payload.autoApprove());
            assertTrue(payload.files().get("versions.tf").contains("opentofu/google"));
        }
    }

    // ─── Full Flow: AWS ───────────────────────────────────────

    @Nested
    @DisplayName("AWS: Full provisioning flow")
    class AwsFlow {

        @Test
        @DisplayName("generates valid Terraform with correct env vars")
        void awsFlow_producesCorrectPayload() {
            var design = awsDesign();
            var cred = awsCredential();
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-aws")).thenReturn(design);
            when(credentialService.findById("cred-aws")).thenReturn(Optional.of(cred));
            when(engineClient.execute(any())).thenReturn(SUCCESS);

            var response = controller.provisionApply("canvas-aws",
                new ProvisionController.ProvisionRequest("cred-aws", "terraform", false));

            assertEquals(200, response.getStatusCodeValue());

            var captor = ArgumentCaptor.forClass(ProvisionEngineClient.ProvisionPayload.class);
            verify(engineClient).execute(captor.capture());
            var payload = captor.getValue();

            assertEquals("aws", payload.provider());
            assertEquals(3, payload.resourceCount());

            // AWS resources
            String mainTf = payload.files().get("main.tf");
            assertTrue(mainTf.contains("aws_vpc"));
            assertTrue(mainTf.contains("aws_subnet"));
            assertTrue(mainTf.contains("aws_instance"));

            // AWS credentials
            var envVars = payload.envVars();
            assertEquals("AKIAIOSFODNN7EXAMPLE", envVars.get("AWS_ACCESS_KEY_ID"));
            assertEquals("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", envVars.get("AWS_SECRET_ACCESS_KEY"));
            assertEquals("us-east-1", envVars.get("AWS_DEFAULT_REGION"));
        }

        @Test
        @DisplayName("credential provider mismatch is rejected")
        void awsCredentialMismatch_rejected() {
            var gcpCred = new Credential("tenant-integration", "Wrong", "google", "sa", "{}");
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-aws")).thenReturn(awsDesign());
            when(credentialService.findById("wrong-cred")).thenReturn(Optional.of(gcpCred));

            var response = controller.provisionApply("canvas-aws",
                new ProvisionController.ProvisionRequest("wrong-cred", "terraform", false));

            assertEquals(400, response.getStatusCodeValue());
            assertTrue(response.getBody().get("error").toString().toLowerCase().contains("mismatch"));
        }
    }

    // ─── Full Flow: Azure ─────────────────────────────────────

    @Nested
    @DisplayName("Azure: Full provisioning flow")
    class AzureFlow {

        @Test
        @DisplayName("generates valid Terraform with ARM credentials")
        void azureFlow_producesCorrectPayload() {
            var design = azureDesign();
            var cred = azureCredential();
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-azure")).thenReturn(design);
            when(credentialService.findById("cred-azure")).thenReturn(Optional.of(cred));
            when(engineClient.execute(any())).thenReturn(SUCCESS);

            var response = controller.provisionApply("canvas-azure",
                new ProvisionController.ProvisionRequest("cred-azure", "terraform", false));

            assertEquals(200, response.getStatusCodeValue());

            var captor = ArgumentCaptor.forClass(ProvisionEngineClient.ProvisionPayload.class);
            verify(engineClient).execute(captor.capture());
            var payload = captor.getValue();

            assertEquals("azurerm", payload.provider());
            assertEquals(2, payload.resourceCount());

            String mainTf = payload.files().get("main.tf");
            assertTrue(mainTf.contains("azurerm_virtual_network"));
            assertTrue(mainTf.contains("azurerm_virtual_machine"));

            var envVars = payload.envVars();
            assertEquals("azure-client-123", envVars.get("ARM_CLIENT_ID"));
            assertEquals("azure-secret-456", envVars.get("ARM_CLIENT_SECRET"));
            assertEquals("azure-tenant-789", envVars.get("ARM_TENANT_ID"));
            assertEquals("azure-sub-012", envVars.get("ARM_SUBSCRIPTION_ID"));
        }
    }

    // ─── Engine Error Scenarios ────────────────────────────────

    @Nested
    @DisplayName("Engine error scenarios")
    class EngineErrors {

        @Test
        @DisplayName("engine failure returns 502")
        void engineFailure_returns502() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-fail")).thenReturn(awsDesign());
            when(credentialService.findById("cred-aws")).thenReturn(Optional.of(awsCredential()));
            when(engineClient.execute(any())).thenThrow(new RuntimeException("Connection refused"));

            var response = controller.provisionApply("canvas-fail",
                new ProvisionController.ProvisionRequest("cred-aws", "terraform", false));

            assertEquals(502, response.getStatusCodeValue());
            assertTrue(response.getBody().get("error").toString().contains("unavailable"));
        }

        @Test
        @DisplayName("engine returns FAILED status")
        void engineReturnsFailed() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-fail2")).thenReturn(awsDesign());
            when(credentialService.findById("cred-aws")).thenReturn(Optional.of(awsCredential()));
            when(engineClient.execute(any())).thenReturn(ENGINE_ERROR);

            var response = controller.provisionApply("canvas-fail2",
                new ProvisionController.ProvisionRequest("cred-aws", "terraform", false));

            assertEquals(200, response.getStatusCodeValue());
            assertEquals("FAILED", response.getBody().get("status"));
            assertEquals("Connection refused", response.getBody().get("error"));
        }

        @Test
        @DisplayName("engine returns PLANNED status for plan-only")
        void engineReturnsPlanned() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-plan")).thenReturn(awsDesign());
            when(credentialService.findById("cred-aws")).thenReturn(Optional.of(awsCredential()));
            when(engineClient.execute(any())).thenReturn(PLAN_ONLY);

            var response = controller.provisionApply("canvas-plan",
                new ProvisionController.ProvisionRequest("cred-aws", "terraform", false));

            assertEquals(200, response.getStatusCodeValue());
            assertEquals("PLANNED", response.getBody().get("status"));
        }
    }

    // ─── Validation Errors ─────────────────────────────────────

    @Nested
    @DisplayName("Validation errors")
    class ValidationErrors {

        @Test
        @DisplayName("empty canvas returns 400")
        void emptyCanvas_returns400() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-empty"))
                .thenReturn(new CanvasDesign("canvas-empty", "Empty", List.of(), List.of()));

            var response = controller.provisionApply("canvas-empty",
                new ProvisionController.ProvisionRequest(null, "terraform", false));

            assertEquals(400, response.getStatusCodeValue());
            assertTrue(response.getBody().get("error").toString().toLowerCase().contains("no nodes"));
        }

        @Test
        @DisplayName("missing canvas returns 400")
        void missingCanvas_returns400() {
            when(canvasDesignFetcher.fetchCanvasDesign("nonexistent"))
                .thenThrow(new RuntimeException("Canvas not found"));

            var response = controller.provisionApply("nonexistent",
                new ProvisionController.ProvisionRequest(null, "terraform", false));

            assertEquals(400, response.getStatusCodeValue());
        }

        @Test
        @DisplayName("missing credential returns 400")
        void missingCredential_returns400() {
            when(canvasDesignFetcher.fetchCanvasDesign("c1")).thenReturn(awsDesign());
            when(credentialService.findById("bad-cred")).thenReturn(Optional.empty());

            var response = controller.provisionApply("c1",
                new ProvisionController.ProvisionRequest("bad-cred", "terraform", false));

            assertEquals(400, response.getStatusCodeValue());
            assertTrue(response.getBody().get("error").toString().contains("not found"));
        }

        @Test
        @DisplayName("no tenant returns 400")
        void noTenant_returns400() {
            TenantContext.clear();
            var response = controller.provisionApply("canvas-1",
                new ProvisionController.ProvisionRequest("cred-1", "terraform", false));

            assertEquals(400, response.getStatusCodeValue());
            assertTrue(response.getBody().get("error").toString().contains("tenant"));
        }
    }

    // ─── Preview Endpoint ──────────────────────────────────────

    @Nested
    @DisplayName("Preview endpoint")
    class Preview {

        @Test
        @DisplayName("returns generated code without engine call")
        void preview_returnsCodeWithoutEngine() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-preview")).thenReturn(gcpDesign());

            var response = controller.provisionPreview("canvas-preview", "terraform");

            assertEquals(200, response.getStatusCodeValue());
            var body = response.getBody();
            assertEquals("google", body.get("provider"));
            assertEquals(4, body.get("resourceCount"));

            // Engine should NOT be called
            verify(engineClient, never()).execute(any());
            // Credentials should NOT be checked
            verify(credentialService, never()).findById(anyString());
        }
    }

    // ─── Payload Contract ──────────────────────────────────────

    @Nested
    @DisplayName("Payload contract")
    class PayloadContract {

        @Test
        @DisplayName("payload matches Go engine expected structure")
        void payloadMatchesGoEngineContract() {
            when(canvasDesignFetcher.fetchCanvasDesign("c1")).thenReturn(awsDesign());
            when(engineClient.execute(any())).thenReturn(SUCCESS);

            var response = controller.provisionApply("c1",
                new ProvisionController.ProvisionRequest(null, "terraform", false));

            var captor = ArgumentCaptor.forClass(ProvisionEngineClient.ProvisionPayload.class);
            verify(engineClient).execute(captor.capture());
            var payload = captor.getValue();

            // All required fields for Go engine
            assertNotNull(payload.canvasId());
            assertNotNull(payload.tenantId());
            assertNotNull(payload.provider());
            assertNotNull(payload.engine());
            assertNotNull(payload.files());
            assertTrue(payload.files().containsKey("main.tf"), "Go engine requires main.tf");
        }

        @Test
        @DisplayName("null credential generates empty env vars")
        void nullCredential_emptyEnvVars() {
            when(canvasDesignFetcher.fetchCanvasDesign("c2")).thenReturn(awsDesign());
            when(engineClient.execute(any())).thenReturn(SUCCESS);

            var response = controller.provisionApply("c2",
                new ProvisionController.ProvisionRequest(null, "terraform", false));

            var captor = ArgumentCaptor.forClass(ProvisionEngineClient.ProvisionPayload.class);
            verify(engineClient).execute(captor.capture());
            assertTrue(captor.getValue().envVars().isEmpty());
        }
    }

    // ─── Test Data Builders ────────────────────────────────────

    private CanvasDesign gcpDesign() {
        var nodes = List.of(
            new DesignNode("vpc", "google_compute_network", "google",
                Map.of("name", "main-vpc", "auto_create_subnetworks", "false"), 100.0, 200.0),
            new DesignNode("subnet", "google_compute_subnetwork", "google",
                Map.of("name", "main-subnet", "ipCidrRange", "10.0.1.0/24", "region", "us-central1"), 400.0, 200.0),
            new DesignNode("vm", "google_compute_instance", "google",
                Map.of("name", "web-server", "machineType", "e2-medium", "zone", "us-central1-a"), 700.0, 100.0),
            new DesignNode("sql", "google_sql_database_instance", "google",
                Map.of("name", "app-db", "databaseVersion", "POSTGRES_14", "tier", "db-f1-micro"), 700.0, 300.0)
        );
        var edges = List.of(
            new DesignEdge("e1", "vpc", "subnet", "contains"),
            new DesignEdge("e2", "subnet", "vm", "deploys"),
            new DesignEdge("e3", "subnet", "sql", "connects")
        );
        return new CanvasDesign("canvas-gcp", "GCP Stack", nodes, edges);
    }

    private CanvasDesign awsDesign() {
        var nodes = List.of(
            new DesignNode("vpc", "aws_vpc", "aws",
                Map.of("cidr_block", "10.0.0.0/16", "name", "prod-vpc"), 100.0, 200.0),
            new DesignNode("subnet", "aws_subnet", "aws",
                Map.of("cidr_block", "10.0.1.0/24", "vpc_id", "vpc", "availability_zone", "us-east-1a"), 400.0, 200.0),
            new DesignNode("ec2", "aws_instance", "aws",
                Map.of("ami", "ami-12345", "instance_type", "t3.large", "subnet_id", "subnet"), 700.0, 100.0)
        );
        return new CanvasDesign("canvas-aws", "AWS Stack", nodes, List.of());
    }

    private CanvasDesign azureDesign() {
        var nodes = List.of(
            new DesignNode("vnet", "azurerm_virtual_network", "azurerm",
                Map.of("name", "prod-vnet", "address_space", "10.0.0.0/16"), 100.0, 200.0),
            new DesignNode("vm", "azurerm_virtual_machine", "azurerm",
                new java.util.LinkedHashMap<>(Map.of(
                    "name", "web-vm", "vm_size", "Standard_DS1_v2",
                    "image_publisher", "Canonical", "image_offer", "0001-comubuntu-server-jammy",
                    "image_sku", "22_04-lts", "admin_username", "admin",
                    "admin_password", "Pass123!", "resource_group_id", "vnet",
                    "network_interface_id", "nic")), 700.0, 100.0)
        );
        return new CanvasDesign("canvas-azure", "Azure Stack", nodes, List.of());
    }

    private Credential gcpCredential() {
        return new Credential("tenant-integration", "GCP SA", "google", "service-account",
            "{\"type\":\"service_account\",\"project_id\":\"my-project\"}");
    }

    private Credential awsCredential() {
        return new Credential("tenant-integration", "AWS Key", "aws", "access-key",
            "{\"accessKeyId\":\"AKIAIOSFODNN7EXAMPLE\",\"secretAccessKey\":\"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\",\"region\":\"us-east-1\"}");
    }

    private Credential azureCredential() {
        return new Credential("tenant-integration", "Azure SP", "azurerm", "service-principal",
            "{\"clientId\":\"azure-client-123\",\"clientSecret\":\"azure-secret-456\",\"tenantId\":\"azure-tenant-789\",\"subscriptionId\":\"azure-sub-012\"}");
    }
}
