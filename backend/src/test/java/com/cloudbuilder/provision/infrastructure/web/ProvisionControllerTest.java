package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.application.dto.CanvasDesign.DesignEdge;
import com.cloudbuilder.provision.application.dto.CanvasDesign.DesignNode;
import com.cloudbuilder.provision.application.dto.GeneratedCode;
import com.cloudbuilder.provision.application.port.CanvasDesignFetcher;
import com.cloudbuilder.provision.domain.service.CodeGeneratorService;
import com.cloudbuilder.provision.infrastructure.adapter.ProvisionEngineClient;
import com.cloudbuilder.credential.domain.model.Credential;
import com.cloudbuilder.credential.domain.service.CredentialService;
import com.cloudbuilder.shared.security.TenantContext;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProvisionControllerTest {

    @Mock
    private CanvasDesignFetcher canvasDesignFetcher;
    @Mock
    private CodeGeneratorService codeGeneratorService;
    @Mock
    private CredentialService credentialService;
    @Mock
    private ProvisionEngineClient engineClient;
    @InjectMocks
    private ProvisionController controller;

    private static final ProvisionEngineClient.EngineResponse SUCCESS_RESPONSE =
        new ProvisionEngineClient.EngineResponse("dep-1", "APPLIED", "Applied successfully", "Plan output", "Apply output", "", 5000L);

    private CanvasDesign gcpDesign;
    private GeneratedCode generatedCode;
    private Credential gcpCredential;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId("tenant-1");
        // GCP canvas with VPC + Subnet + VM + SQL
        var nodes = List.of(
            new DesignNode("node-vpc", "google_compute_network", "google",
                Map.of("name", "main-vpc", "region", "us-central1"), 100.0, 200.0),
            new DesignNode("node-subnet", "google_compute_subnetwork", "google",
                Map.of("name", "main-subnet", "ipCidrRange", "10.0.1.0/24"), 400.0, 200.0),
            new DesignNode("node-vm", "google_compute_instance", "google",
                Map.of("name", "web-server", "machineType", "e2-medium", "zone", "us-central1-a"), 700.0, 100.0),
            new DesignNode("node-sql", "google_sql_database_instance", "google",
                Map.of("name", "app-db", "databaseVersion", "POSTGRES_14", "tier", "db-f1-micro"), 700.0, 300.0)
        );
        var edges = List.of(
            new DesignEdge("e1", "node-vpc", "node-subnet", "contains"),
            new DesignEdge("e2", "node-subnet", "node-vm", "deploys"),
            new DesignEdge("e3", "node-subnet", "node-sql", "connects")
        );
        gcpDesign = new CanvasDesign("canvas-1", "GCP Stack", nodes, edges);

        generatedCode = new GeneratedCode(
            "canvas-1", "google",
            Map.of(
                "main.tf", "resource \"google_compute_network\" \"node-vpc\" {\n  name = \"{{name}}\"\n}\n",
                "variables.tf", "variable \"gcp_project_id\" {\n  type = string\n}\n",
                "outputs.tf", "output \"network_id\" {\n  value = google_compute_network.node-vpc.id\n}\n",
                "providers.tf", "provider \"google\" {\n}\n",
                "versions.tf", "terraform {\n  required_providers {\n    google = {\n      source  = \"hashicorp/google\"\n      version = \"~> 5.0\"\n    }\n  }\n}\n"
            ),
            4, System.currentTimeMillis()
        );

        gcpCredential = new Credential("tenant-1", "GCP SA", "google", "service-account",
            "{\"type\":\"service_account\",\"project_id\":\"my-project\"}");
    }

    @Test
    void provisionApply_withValidCanvasAndCredential_callsEngine() {
        when(canvasDesignFetcher.fetchCanvasDesign("canvas-1")).thenReturn(gcpDesign);
        when(codeGeneratorService.generateCode(eq(gcpDesign), eq("google"), eq("terraform")))
            .thenReturn(generatedCode);
        when(credentialService.findById("cred-1")).thenReturn(Optional.of(gcpCredential));
        when(engineClient.execute(any())).thenReturn(SUCCESS_RESPONSE);

        var request = new ProvisionController.ProvisionRequest("cred-1", "terraform", false);

        var response = controller.provisionApply("canvas-1", request);

        assertEquals(200, response.getStatusCodeValue());
        var body = response.getBody();
        assertNotNull(body);
        assertEquals("APPLIED", body.get("status"));
        assertEquals("dep-1", body.get("deploymentId"));

        // Verify engine was called with correct payload
        var captor = ArgumentCaptor.forClass(ProvisionEngineClient.ProvisionPayload.class);
        verify(engineClient).execute(captor.capture());
        var payload = captor.getValue();
        assertEquals("canvas-1", payload.canvasId());
        assertEquals("google", payload.provider());
        assertEquals("terraform", payload.engine());
        assertEquals(4, payload.resourceCount());
        assertTrue(payload.envVars().containsKey("GOOGLE_CREDENTIALS"));
    }

    @Test
    void provisionApply_withEmptyCanvas_returnsBadRequest() {
        var emptyDesign = new CanvasDesign("canvas-2", "Empty", List.of(), List.of());
        when(canvasDesignFetcher.fetchCanvasDesign("canvas-2")).thenReturn(emptyDesign);

        var request = new ProvisionController.ProvisionRequest(null, "terraform", false);

        var response = controller.provisionApply("canvas-2", request);

        assertEquals(400, response.getStatusCodeValue());
        assertTrue(response.getBody().get("error").toString().contains("no nodes"));
    }

    @Test
    void provisionApply_withNonexistentCredential_returnsBadRequest() {
        when(canvasDesignFetcher.fetchCanvasDesign("canvas-1")).thenReturn(gcpDesign);
        when(codeGeneratorService.generateCode(eq(gcpDesign), eq("google"), eq("terraform")))
            .thenReturn(generatedCode);
        when(credentialService.findById("bad-cred")).thenReturn(Optional.empty());

        var request = new ProvisionController.ProvisionRequest("bad-cred", "terraform", false);

        var response = controller.provisionApply("canvas-1", request);

        assertEquals(400, response.getStatusCodeValue());
        assertTrue(response.getBody().get("error").toString().contains("not found"));
    }

    @Test
    void provisionApply_autoApprovePassedThrough() {
        when(canvasDesignFetcher.fetchCanvasDesign("canvas-1")).thenReturn(gcpDesign);
        when(codeGeneratorService.generateCode(eq(gcpDesign), eq("google"), eq("terraform")))
            .thenReturn(generatedCode);
        when(credentialService.findById("cred-1")).thenReturn(Optional.of(gcpCredential));
        when(engineClient.execute(any())).thenReturn(SUCCESS_RESPONSE);

        var request = new ProvisionController.ProvisionRequest("cred-1", "terraform", true);

        var response = controller.provisionApply("canvas-1", request);

        assertEquals(200, response.getStatusCodeValue());

        var captor = ArgumentCaptor.forClass(ProvisionEngineClient.ProvisionPayload.class);
        verify(engineClient).execute(captor.capture());
        assertTrue(captor.getValue().autoApprove());
    }

    @Test
    void provisionApply_awsCredential_injectsCorrectEnvVars() {
        var awsNodes = List.of(
            new DesignNode("node-vpc", "aws_vpc", "aws",
                Map.of("cidr_block", "10.0.0.0/16"), 100.0, 200.0)
        );
        var awsDesign = new CanvasDesign("canvas-aws", "AWS Stack", awsNodes, List.of());

        var awsCode = new GeneratedCode(
            "canvas-aws", "aws",
            Map.of("main.tf", "resource \"aws_vpc\" \"node-vpc\" {\n}", "versions.tf", "aws\n", "variables.tf", "x\n", "outputs.tf", "x\n", "providers.tf", "x\n"),
            1, System.currentTimeMillis()
        );

        var awsCred = new Credential("tenant-1", "AWS Key", "aws", "access-key",
            "{\"accessKeyId\":\"AKIA123\",\"secretAccessKey\":\"secret456\",\"region\":\"us-east-1\"}");

        when(canvasDesignFetcher.fetchCanvasDesign("canvas-aws")).thenReturn(awsDesign);
        when(codeGeneratorService.generateCode(eq(awsDesign), eq("aws"), eq("terraform")))
            .thenReturn(awsCode);
        when(credentialService.findById("aws-cred")).thenReturn(Optional.of(awsCred));
        when(engineClient.execute(any())).thenReturn(SUCCESS_RESPONSE);

        var request = new ProvisionController.ProvisionRequest("aws-cred", "terraform", false);

        var response = controller.provisionApply("canvas-aws", request);

        assertEquals(200, response.getStatusCodeValue());

        var captor = ArgumentCaptor.forClass(ProvisionEngineClient.ProvisionPayload.class);
        verify(engineClient).execute(captor.capture());
        var envVars = captor.getValue().envVars();
        assertEquals("AKIA123", envVars.get("AWS_ACCESS_KEY_ID"));
        assertEquals("secret456", envVars.get("AWS_SECRET_ACCESS_KEY"));
        assertEquals("us-east-1", envVars.get("AWS_DEFAULT_REGION"));
    }

    @Test
    void provisionPreview_returnsGeneratedCodeWithoutProvisioning() {
        when(canvasDesignFetcher.fetchCanvasDesign("canvas-1")).thenReturn(gcpDesign);
        when(codeGeneratorService.generateCode(eq(gcpDesign), eq("google"), eq("terraform")))
            .thenReturn(generatedCode);

        var response = controller.provisionPreview("canvas-1", "terraform");

        assertEquals(200, response.getStatusCodeValue());
        var body = response.getBody();
        assertNotNull(body);
        assertEquals("google", body.get("provider"));
        assertEquals(4, body.get("resourceCount"));

        verify(credentialService, never()).findById(anyString());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }
}
