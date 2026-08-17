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
import com.cloudbuilder.shared.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * End-to-end integration test for the provisioning flow:
 *
 *   CanvasDesign → CodeGeneratorService → ProvisionController → Go engine payload
 *
 * This tests the full pipeline WITHOUT mocking CodeGeneratorService — only the
 * external dependencies (CanvasDesignFetcher, CredentialService) are mocked.
 * This verifies that code generation, credential injection, and payload construction
 * all work together correctly for each cloud provider.
 */
@ExtendWith(MockitoExtension.class)
class ProvisionFlowE2ETest {

    @Mock
    private CanvasDesignFetcher canvasDesignFetcher;
    @Mock
    private CredentialService credentialService;
    @Mock
    private TerraformTemplateRepository templateRepository;

    private CodeGeneratorService codeGeneratorService;
    private ProvisionController controller;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId("tenant-e2e");
        codeGeneratorService = new CodeGeneratorService(templateRepository);
        controller = new ProvisionController(canvasDesignFetcher, codeGeneratorService, credentialService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ─── GCP Stack ──────────────────────────────────────────────────

    @Nested
    @DisplayName("GCP: VPC → Subnet → VM → SQL")
    class GcpStack {

        private CanvasDesign gcpDesign;
        private Credential gcpCredential;

        @BeforeEach
        void setupGcp() {
            var nodes = List.of(
                new DesignNode("gcp-vpc", "google_compute_network", "google",
                    Map.of("name", "main-vpc", "auto_create_subnetworks", "false",
                           "routing_mode", "GLOBAL"),
                    100.0, 200.0),
                new DesignNode("gcp-subnet", "google_compute_subnetwork", "google",
                    Map.of("name", "main-subnet", "network", "gcp-vpc",
                           "ipCidrRange", "10.0.1.0/24", "region", "us-central1"),
                    400.0, 200.0),
                new DesignNode("gcp-vm", "google_compute_instance", "google",
                    Map.of("name", "web-server", "machineType", "e2-medium",
                           "zone", "us-central1-a", "subnetwork", "gcp-subnet",
                           "bootDiskImage", "debian-cloud/debian-11"),
                    700.0, 100.0),
                new DesignNode("gcp-sql", "google_sql_database_instance", "google",
                    Map.of("name", "app-db", "databaseVersion", "POSTGRES_14",
                           "region", "us-central1", "tier", "db-f1-micro"),
                    700.0, 300.0)
            );
            var edges = List.of(
                new DesignEdge("e1", "gcp-vpc", "gcp-subnet", "contains"),
                new DesignEdge("e2", "gcp-subnet", "gcp-vm", "deploys"),
                new DesignEdge("e3", "gcp-subnet", "gcp-sql", "connects")
            );
            gcpDesign = new CanvasDesign("canvas-gcp", "GCP Stack", nodes, edges);
            gcpCredential = new Credential("tenant-e2e", "GCP Service Account", "google",
                "service-account",
                "{\"type\":\"service_account\",\"project_id\":\"my-gcp-project\",\"private_key\":\"-----BEGIN RSA PRIVATE KEY-----\\nfake\\n-----END RSA PRIVATE KEY-----\"}");
        }

        @Test
        @DisplayName("full GCP flow: generates valid Terraform and correct env vars")
        void gcpFullFlow_producesCorrectPayload() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-gcp")).thenReturn(gcpDesign);
            when(credentialService.findById("gcp-cred-1")).thenReturn(Optional.of(gcpCredential));

            var request = new ProvisionController.ProvisionRequest("gcp-cred-1", "terraform", false);
            var response = controller.provisionApply("canvas-gcp", request);

            assertEquals(200, response.getStatusCodeValue());
            var body = response.getBody();
            assertNotNull(body);

            // Provider detection
            assertEquals("google", body.get("provider"));
            assertEquals("terraform", body.get("engine"));
            assertEquals(4, body.get("resourceCount"));
            assertEquals(false, body.get("autoApprove"));

            // File generation — all 5 files present
            @SuppressWarnings("unchecked")
            var files = (Map<String, String>) body.get("files");
            assertNotNull(files);
            assertTrue(files.containsKey("main.tf"), "main.tf must be present");
            assertTrue(files.containsKey("variables.tf"));
            assertTrue(files.containsKey("outputs.tf"));
            assertTrue(files.containsKey("providers.tf"));
            assertTrue(files.containsKey("versions.tf"));

            // main.tf contains all 4 resources
            String mainTf = files.get("main.tf");
            assertTrue(mainTf.contains("google_compute_network"), "VPC resource in main.tf");
            assertTrue(mainTf.contains("google_compute_subnetwork"), "Subnet resource in main.tf");
            assertTrue(mainTf.contains("google_compute_instance"), "VM resource in main.tf");
            assertTrue(mainTf.contains("google_sql_database_instance"), "SQL resource in main.tf");

            // Template variables are substituted
            assertTrue(mainTf.contains("main-vpc"), "VPC name substituted");
            assertTrue(mainTf.contains("main-subnet"), "Subnet name substituted");
            assertTrue(mainTf.contains("web-server"), "VM name substituted");
            assertTrue(mainTf.contains("app-db"), "SQL name substituted");

            // providers.tf uses Google provider
            String providersTf = files.get("providers.tf");
            assertTrue(providersTf.contains("provider \"google\""));

            // versions.tf references hashicorp/google (terraform, not opentofu)
            String versionsTf = files.get("versions.tf");
            assertTrue(versionsTf.contains("hashicorp/google"));
            assertFalse(versionsTf.contains("hashicorp/aws"));

            // Credential injection
            @SuppressWarnings("unchecked")
            var envVars = (Map<String, String>) body.get("envVars");
            assertNotNull(envVars);
            assertTrue(envVars.containsKey("GOOGLE_CREDENTIALS"));
            assertTrue(envVars.get("GOOGLE_CREDENTIALS").contains("service_account"));
        }

        @Test
        @DisplayName("GCP with OpenTofu uses opentofu/google source")
        void gcpOpenTofu_usesCorrectSource() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-gcp")).thenReturn(gcpDesign);
            when(credentialService.findById("gcp-cred-1")).thenReturn(Optional.of(gcpCredential));

            var request = new ProvisionController.ProvisionRequest("gcp-cred-1", "opentofu", true);
            var response = controller.provisionApply("canvas-gcp", request);

            assertEquals(200, response.getStatusCodeValue());
            var body = response.getBody();

            assertEquals("opentofu", body.get("engine"));
            assertEquals(true, body.get("autoApprove"));

            @SuppressWarnings("unchecked")
            var files = (Map<String, String>) body.get("files");
            String versionsTf = files.get("versions.tf");
            assertTrue(versionsTf.contains("opentofu/google"));
            assertFalse(versionsTf.contains("hashicorp/google"));
        }

        @Test
        @DisplayName("GCP preview returns code without credential check")
        void gcpPreview_noCredentialLookup() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-gcp")).thenReturn(gcpDesign);

            var response = controller.provisionPreview("canvas-gcp", "terraform");

            assertEquals(200, response.getStatusCodeValue());
            var body = response.getBody();
            assertEquals("google", body.get("provider"));
            assertEquals(4, body.get("resourceCount"));

            // Verify credential service was NOT called
            verify(credentialService, never()).findById(anyString());
        }
    }

    // ─── AWS Stack ──────────────────────────────────────────────────

    @Nested
    @DisplayName("AWS: VPC → Subnet → EC2 → RDS")
    class AwsStack {

        private CanvasDesign awsDesign;
        private Credential awsCredential;

        @BeforeEach
        void setupAws() {
            var nodes = List.of(
                new DesignNode("aws-vpc", "aws_vpc", "aws",
                    Map.of("cidr_block", "10.0.0.0/16", "name", "prod-vpc",
                           "enable_dns_hostnames", "true", "enable_dns_support", "true",
                           "instance_tenancy", "default", "environment", "production"),
                    100.0, 200.0),
                new DesignNode("aws-subnet", "aws_subnet", "aws",
                    Map.of("cidr_block", "10.0.1.0/24", "vpc_id", "aws-vpc",
                           "availability_zone", "us-east-1a", "map_public_ip_on_launch", "true",
                           "name", "public-subnet", "environment", "production"),
                    400.0, 200.0),
                new DesignNode("aws-ec2", "aws_instance", "aws",
                    Map.of("ami", "ami-0c55b159cbfafe1f0", "instance_type", "t3.large",
                           "subnet_id", "aws-subnet", "security_group_id", "aws-sg",
                           "key_name", "my-keypair", "associate_public_ip_address", "true",
                           "root_volume_size", "50", "root_volume_type", "gp3",
                           "name", "web-server", "environment", "production"),
                    700.0, 100.0)
            );
            awsDesign = new CanvasDesign("canvas-aws", "AWS Stack", nodes, List.of());
            awsCredential = new Credential("tenant-e2e", "AWS Access Key", "aws", "access-key",
                "{\"accessKeyId\":\"AKIAIOSFODNN7EXAMPLE\",\"secretAccessKey\":\"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\",\"region\":\"us-east-1\"}");
        }

        @Test
        @DisplayName("full AWS flow: generates correct Terraform and AWS env vars")
        void awsFullFlow_producesCorrectPayload() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-aws")).thenReturn(awsDesign);
            when(credentialService.findById("aws-cred-1")).thenReturn(Optional.of(awsCredential));

            var request = new ProvisionController.ProvisionRequest("aws-cred-1", "terraform", false);
            var response = controller.provisionApply("canvas-aws", request);

            assertEquals(200, response.getStatusCodeValue());
            var body = response.getBody();
            assertEquals("aws", body.get("provider"));
            assertEquals(3, body.get("resourceCount"));

            @SuppressWarnings("unchecked")
            var files = (Map<String, String>) body.get("files");
            String mainTf = files.get("main.tf");

            // All 3 AWS resources present
            assertTrue(mainTf.contains("aws_vpc"));
            assertTrue(mainTf.contains("aws_subnet"));
            assertTrue(mainTf.contains("aws_instance"));

            // Properties substituted
            assertTrue(mainTf.contains("10.0.0.0/16"), "VPC CIDR");
            assertTrue(mainTf.contains("10.0.1.0/24"), "Subnet CIDR");
            assertTrue(mainTf.contains("t3.large"), "Instance type");
            assertTrue(mainTf.contains("prod-vpc"), "VPC name");

            // providers.tf uses AWS
            String providersTf = files.get("providers.tf");
            assertTrue(providersTf.contains("provider \"aws\""));
            assertTrue(providersTf.contains("var.aws_region"));

            // versions.tf has hashicorp/aws
            String versionsTf = files.get("versions.tf");
            assertTrue(versionsTf.contains("hashicorp/aws"));
            assertTrue(versionsTf.contains("~> 5.0"));

            // AWS credential injection
            @SuppressWarnings("unchecked")
            var envVars = (Map<String, String>) body.get("envVars");
            assertEquals("AKIAIOSFODNN7EXAMPLE", envVars.get("AWS_ACCESS_KEY_ID"));
            assertEquals("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", envVars.get("AWS_SECRET_ACCESS_KEY"));
            assertEquals("us-east-1", envVars.get("AWS_DEFAULT_REGION"));
        }

        @Test
        @DisplayName("AWS credential mismatch is rejected")
        void awsCredentialMismatch_rejected() {
            // Provide a GCP credential for an AWS canvas
            var gcpCred = new Credential("tenant-e2e", "Wrong Cred", "google", "sa",
                "{\"type\":\"service_account\"}");
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-aws")).thenReturn(awsDesign);
            when(credentialService.findById("wrong-cred")).thenReturn(Optional.of(gcpCred));

            var request = new ProvisionController.ProvisionRequest("wrong-cred", "terraform", false);
            var response = controller.provisionApply("canvas-aws", request);

            assertEquals(400, response.getStatusCodeValue());
            assertTrue(response.getBody().get("error").toString().contains("mismatch"));
        }
    }

    // ─── Azure Stack ────────────────────────────────────────────────

    @Nested
    @DisplayName("Azure: VNet (only built-in templates available)")
    class AzureStack {

        private CanvasDesign azureDesign;
        private Credential azureCredential;

        @BeforeEach
        void setupAzure() {
            var nodes = List.of(
                new DesignNode("azure-vnet", "azurerm_virtual_network", "azurerm",
                    Map.of("name", "prod-vnet", "address_space", "10.0.0.0/16",
                           "environment", "production"),
                    100.0, 200.0),
                new DesignNode("azure-vm", "azurerm_virtual_machine", "azurerm",
                    new java.util.LinkedHashMap<>(Map.ofEntries(
                        Map.entry("name", "web-vm"),
                        Map.entry("vm_size", "Standard_DS1_v2"),
                        Map.entry("image_publisher", "Canonical"),
                        Map.entry("image_offer", "0001-comubuntu-server-jammy"),
                        Map.entry("image_sku", "22_04-lts"),
                        Map.entry("admin_username", "azureadmin"),
                        Map.entry("admin_password", "Password123!"),
                        Map.entry("managed_disk_type", "Premium_LRS"),
                        Map.entry("resource_group_id", "azure-vnet"),
                        Map.entry("network_interface_id", "azure-nic"),
                        Map.entry("environment", "production"))),
                    700.0, 100.0)
            );
            azureDesign = new CanvasDesign("canvas-azure", "Azure Stack", nodes, List.of());
            azureCredential = new Credential("tenant-e2e", "Azure SP", "azurerm", "service-principal",
                "{\"clientId\":\"azure-client-123\",\"clientSecret\":\"azure-secret-456\",\"tenantId\":\"azure-tenant-789\",\"subscriptionId\":\"azure-sub-012\"}");
        }

        @Test
        @DisplayName("full Azure flow: generates correct Terraform and ARM env vars")
        void azureFullFlow_producesCorrectPayload() {
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-azure")).thenReturn(azureDesign);
            when(credentialService.findById("azure-cred-1")).thenReturn(Optional.of(azureCredential));

            var request = new ProvisionController.ProvisionRequest("azure-cred-1", "terraform", false);
            var response = controller.provisionApply("canvas-azure", request);

            assertEquals(200, response.getStatusCodeValue());
            var body = response.getBody();
            assertEquals("azurerm", body.get("provider"));
            assertEquals(2, body.get("resourceCount"));

            @SuppressWarnings("unchecked")
            var files = (Map<String, String>) body.get("files");
            String mainTf = files.get("main.tf");

            assertTrue(mainTf.contains("azurerm_virtual_network"));
            assertTrue(mainTf.contains("azurerm_virtual_machine"));

            // providers.tf uses azurerm
            String providersTf = files.get("providers.tf");
            assertTrue(providersTf.contains("provider \"azurerm\""));
            assertTrue(providersTf.contains("features {}"));

            // Azure credential injection (4 env vars)
            @SuppressWarnings("unchecked")
            var envVars = (Map<String, String>) body.get("envVars");
            assertEquals("azure-client-123", envVars.get("ARM_CLIENT_ID"));
            assertEquals("azure-secret-456", envVars.get("ARM_CLIENT_SECRET"));
            assertEquals("azure-tenant-789", envVars.get("ARM_TENANT_ID"));
            assertEquals("azure-sub-012", envVars.get("ARM_SUBSCRIPTION_ID"));
        }
    }

    // ─── Edge Cases ─────────────────────────────────────────────────

    @Nested
    @DisplayName("Edge cases")
    class EdgeCases {

        @Test
        @DisplayName("empty canvas returns 400 with helpful message")
        void emptyCanvas_returnsBadRequest() {
            var emptyDesign = new CanvasDesign("canvas-empty", "Empty", List.of(), List.of());
            when(canvasDesignFetcher.fetchCanvasDesign("canvas-empty")).thenReturn(emptyDesign);

            var request = new ProvisionController.ProvisionRequest(null, "terraform", false);
            var response = controller.provisionApply("canvas-empty", request);

            assertEquals(400, response.getStatusCodeValue());
            assertTrue(response.getBody().get("error").toString().contains("no nodes"));
        }

        @Test
        @DisplayName("missing canvas returns 400")
        void missingCanvas_returnsBadRequest() {
            when(canvasDesignFetcher.fetchCanvasDesign("nonexistent"))
                .thenThrow(new RuntimeException("Canvas not found"));

            var request = new ProvisionController.ProvisionRequest(null, "terraform", false);
            var response = controller.provisionApply("nonexistent", request);

            assertEquals(400, response.getStatusCodeValue());
            assertTrue(response.getBody().get("error").toString().contains("not found"));
        }

        @Test
        @DisplayName("missing credential returns 400")
        void missingCredential_returnsBadRequest() {
            var design = new CanvasDesign("c1", "test",
                List.of(new DesignNode("n1", "aws_vpc", "aws", Map.of("cidr_block", "10.0.0.0/16"), 0.0, 0.0)),
                List.of());
            when(canvasDesignFetcher.fetchCanvasDesign("c1")).thenReturn(design);
            when(credentialService.findById("bad-cred")).thenReturn(Optional.empty());

            var request = new ProvisionController.ProvisionRequest("bad-cred", "terraform", false);
            var response = controller.provisionApply("c1", request);

            assertEquals(400, response.getStatusCodeValue());
            assertTrue(response.getBody().get("error").toString().contains("not found"));
        }

        @Test
        @DisplayName("no credential (null) is allowed — generates code without env vars")
        void noCredential_generatesCodeWithoutEnvVars() {
            var design = new CanvasDesign("c2", "test",
                List.of(new DesignNode("n1", "aws_vpc", "aws", Map.of(
                    "cidr_block", "10.0.0.0/16", "name", "vpc", "environment", "dev"), 0.0, 0.0)),
                List.of());
            when(canvasDesignFetcher.fetchCanvasDesign("c2")).thenReturn(design);

            var request = new ProvisionController.ProvisionRequest(null, "terraform", false);
            var response = controller.provisionApply("c2", request);

            assertEquals(200, response.getStatusCodeValue());
            @SuppressWarnings("unchecked")
            var envVars = (Map<String, String>) response.getBody().get("envVars");
            assertTrue(envVars.isEmpty(), "No env vars without credential");
        }

        @Test
        @DisplayName("payload structure matches Go engine ProvisionRequest contract")
        void payloadStructure_matchesGoEngineContract() {
            var design = new CanvasDesign("c3", "test",
                List.of(new DesignNode("n1", "aws_vpc", "aws", Map.of(
                    "cidr_block", "10.0.0.0/16", "name", "vpc", "environment", "dev"), 0.0, 0.0)),
                List.of());
            when(canvasDesignFetcher.fetchCanvasDesign("c3")).thenReturn(design);

            var request = new ProvisionController.ProvisionRequest(null, "terraform", false);
            var response = controller.provisionApply("c3", request);
            var body = response.getBody();

            // Verify all fields the Go engine expects are present
            assertNotNull(body.get("canvasId"), "canvasId required by Go engine");
            assertNotNull(body.get("provider"), "provider required by Go engine");
            assertNotNull(body.get("engine"), "engine required by Go engine");
            assertNotNull(body.get("files"), "files required by Go engine");
            assertNotNull(body.get("resourceCount"), "resourceCount required by Go engine");
            assertNotNull(body.get("envVars"), "envVars required by Go engine");
            assertNotNull(body.get("autoApprove"), "autoApprove required by Go engine");
            assertNotNull(body.get("credentialId"), "credentialId required by Go engine");

            // files must contain main.tf (Go engine validates this)
            @SuppressWarnings("unchecked")
            var files = (Map<String, String>) body.get("files");
            assertTrue(files.containsKey("main.tf"), "Go engine requires main.tf");
        }
    }
}
