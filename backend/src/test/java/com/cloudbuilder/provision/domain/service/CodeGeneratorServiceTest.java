package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.domain.port.TerraformTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CodeGeneratorServiceTest {

    @Mock
    private TerraformTemplateRepository templateRepository;

    private CodeGeneratorService codeGeneratorService;

    @BeforeEach
    void setUp() {
        codeGeneratorService = new CodeGeneratorService(templateRepository);
    }

    @Test
    void generateCode_WithValidDesign_ShouldReturnNonEmptyCode() {
        var node = new CanvasDesign.DesignNode(
            "node-1", "vpc", "aws",
            Map.of("cidr", "10.0.0.0/16", "name", "main-vpc"),
            0.0, 0.0
        );
        var design = new CanvasDesign(UUID.randomUUID().toString(), "test-design", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");

        assertNotNull(result);
        assertFalse(result.files().isEmpty());
        assertTrue(result.files().containsKey("main.tf"));
        assertTrue(result.files().containsKey("variables.tf"));
        assertTrue(result.files().containsKey("outputs.tf"));
        assertTrue(result.files().containsKey("providers.tf"));
        assertTrue(result.files().containsKey("versions.tf"));
    }

    @Test
    void generateCode_WithEmptyDesign_ShouldReturnAllFiles() {
        var design = new CanvasDesign(UUID.randomUUID().toString(), "empty", List.of(), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");

        assertNotNull(result);
        assertEquals(5, result.files().size());
        assertEquals(0, result.resourceCount());
    }

    @Test
    void generateCode_WithAwsVpcNode_ShouldRenderResource() {
        var node = new CanvasDesign.DesignNode(
            "main_vpc", "aws_vpc", "aws",
            Map.of("cidr_block", "10.0.0.0/16", "name", "production", "environment", "prod",
                   "enable_dns_hostnames", "true", "enable_dns_support", "true", "instance_tenancy", "default"),
            0.0, 0.0
        );
        var design = new CanvasDesign(UUID.randomUUID().toString(), "vpc", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");
        var main = result.files().get("main.tf");

        assertTrue(main.contains("aws_vpc"));
        assertTrue(main.contains("10.0.0.0/16"));
        assertTrue(main.contains("production"));
        assertEquals(1, result.resourceCount());
    }

    @Test
    void generateCode_WithAwsInstance_ShouldGenerateVariablesAndOutputs() {
        var node = new CanvasDesign.DesignNode(
            "web_server", "aws_instance", "aws",
            Map.of("ami", "ami-0c55b159cbfafe1f0", "instance_type", "t3.large",
                   "name", "web", "environment", "dev"),
            0.0, 0.0
        );
        var design = new CanvasDesign(UUID.randomUUID().toString(), "ec2", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");
        var variables = result.files().get("variables.tf");
        var outputs = result.files().get("outputs.tf");
        var main = result.files().get("main.tf");

        assertTrue(main.contains("aws_instance"));
        assertTrue(main.contains("t3.large"));
        assertTrue(variables.contains("instance_ami"));
        assertTrue(variables.contains("instance_type"));
        assertTrue(outputs.contains("instance_id"));
        assertTrue(outputs.contains("public_ip"));
    }

    @Test
    void generateCode_WithAzureNode_ShouldRenderAzureProvider() {
        var node = new CanvasDesign.DesignNode(
            "my_vnet", "azurerm_virtual_network", "azurerm",
            Map.of("name", "my-vnet", "address_space", "10.0.0.0/16", "environment", "dev"),
            0.0, 0.0
        );
        var design = new CanvasDesign(UUID.randomUUID().toString(), "azure-net", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "azurerm", "terraform");
        var providers = result.files().get("providers.tf");

        assertTrue(providers.contains("azurerm"));
        assertTrue(result.files().get("main.tf").contains("azurerm_virtual_network"));
        assertTrue(result.files().get("variables.tf").contains("azure_location"));
    }

    @Test
    void generateCode_WithGcpNode_ShouldRenderGcpProvider() {
        var node = new CanvasDesign.DesignNode(
            "app_server", "google_compute_instance", "google",
            Map.of("name", "app-server", "machine_type", "e2-standard-2",
                   "zone", "us-central1-a", "environment", "staging"),
            0.0, 0.0
        );
        var design = new CanvasDesign(UUID.randomUUID().toString(), "gcp", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "google", "terraform");
        var providers = result.files().get("providers.tf");

        assertTrue(providers.contains("google"));
        assertTrue(providers.contains("gcp_project_id"));
        assertTrue(result.files().get("main.tf").contains("google_compute_instance"));
    }

    @Test
    void generateCode_WithOpenTofuEngine_ShouldRenderOpenTofuSources() {
        var node = new CanvasDesign.DesignNode(
            "bucket", "aws_s3_bucket", "aws",
            Map.of("bucket_name", "my-bucket", "name", "assets", "environment", "prod"),
            0.0, 0.0
        );
        var design = new CanvasDesign(UUID.randomUUID().toString(), "opentofu", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "opentofu");
        var versions = result.files().get("versions.tf");

        assertTrue(versions.contains("opentofu/aws"));
        assertFalse(versions.contains("hashicorp/aws"));
        assertTrue(versions.contains(">= 1.6.0"));
    }

    @Test
    void generateCode_WithMultipleNodeTypes_ShouldCombineResources() {
        var vpc = new CanvasDesign.DesignNode(
            "vpc1", "aws_vpc", "aws",
            Map.of("cidr_block", "10.0.0.0/16", "name", "main", "environment", "prod"), 0.0, 0.0);
        var subnet = new CanvasDesign.DesignNode(
            "sub1", "aws_subnet", "aws",
            Map.of("cidr_block", "10.0.1.0/24", "vpc_id", "vpc1",
                   "name", "public", "environment", "prod"), 0.0, 0.0);
        var design = new CanvasDesign(UUID.randomUUID().toString(), "multi", List.of(vpc, subnet), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");

        assertEquals(2, result.resourceCount());
        assertTrue(result.files().get("main.tf").contains("aws_vpc"));
        assertTrue(result.files().get("main.tf").contains("aws_subnet"));
    }

    @Test
    void generateCode_WithUnknownResourceType_ShouldSkipGracefully() {
        var node = new CanvasDesign.DesignNode(
            "unknown", "custom_resource_type", "aws",
            Map.of(), 0.0, 0.0
        );
        var design = new CanvasDesign(UUID.randomUUID().toString(), "unknown", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");

        assertNotNull(result);
        assertEquals(0, result.resourceCount());
    }

    @Test
    void generateCode_WithUnknownProvider_ShouldGenerateGenericProviderBlock() {
        var node = new CanvasDesign.DesignNode(
            "svc", "aws_instance", "custom",
            Map.of("ami", "ami-123", "instance_type", "t3.micro", "name", "x", "environment", "dev"), 0.0, 0.0
        );
        var design = new CanvasDesign(UUID.randomUUID().toString(), "custom-provider", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "custom", "terraform");
        var providers = result.files().get("providers.tf");

        assertTrue(providers.contains("custom"));
    }

    @Test
    void generateCode_WithAwsS3Bucket_ShouldGenerateVersioningAndEncryption() {
        var node = new CanvasDesign.DesignNode(
            "assets", "aws_s3_bucket", "aws",
            Map.of("bucket_name", "my-assets", "name", "assets", "environment", "prod",
                   "force_destroy", "true", "versioning_status", "Enabled"), 0.0, 0.0);
        var design = new CanvasDesign(UUID.randomUUID().toString(), "bucket", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");
        var main = result.files().get("main.tf");

        assertTrue(main.contains("aws_s3_bucket"));
        assertTrue(main.contains("aws_s3_bucket_versioning"));
        assertTrue(main.contains("aws_s3_bucket_server_side_encryption_configuration"));
    }

    @Test
    void generateCode_WithAwsSecurityGroup_ShouldRenderIngressAndEgress() {
        var node = new CanvasDesign.DesignNode(
            "web_sg", "aws_security_group", "aws",
            Map.of("name", "web-sg", "description", "Web tier SG", "vpc_id", "vpc1",
                   "ingress_from_port", "80", "ingress_to_port", "443",
                   "ingress_protocol", "tcp", "ingress_cidr_blocks", "0.0.0.0/0",
                   "environment", "prod"), 0.0, 0.0);
        var design = new CanvasDesign(UUID.randomUUID().toString(), "sg", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");
        var main = result.files().get("main.tf");

        assertTrue(main.contains("aws_security_group"));
        assertTrue(main.contains("ingress"));
        assertTrue(main.contains("egress"));
    }

    @Test
    void generateCode_WithAwsLambda_ShouldRenderFunction() {
        var node = new CanvasDesign.DesignNode(
            "my_func", "aws_lambda_function", "aws",
            Map.of("filename", "lambda.zip", "function_name", "my-func",
                   "handler", "index.handler", "runtime", "nodejs20.x",
                   "memory_size", "256", "timeout", "30", "name", "my-func",
                   "environment", "dev"), 0.0, 0.0);
        var design = new CanvasDesign(UUID.randomUUID().toString(), "lambda", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");

        assertTrue(result.files().get("main.tf").contains("aws_lambda_function"));
        assertEquals(1, result.resourceCount());
    }

    @Test
    void renderTemplate_WithAllVarsPresent_ShouldSubstituteCorrectly() {
        var template = "resource \"aws_vpc\" \"{{id}}\" {\n  cidr_block = \"{{cidr_block}}\"\n}\n";
        var props = Map.of("cidr_block", "10.0.0.0/16");

        var result = CodeGeneratorService.renderTemplate(template, props);

        assertTrue(result.contains("10.0.0.0/16"));
        assertFalse(result.contains("{{cidr_block}}"));
    }

    @Test
    void renderTemplate_WithMissingVars_ShouldReplaceWithEmpty() {
        var template = "cidr = \"{{cidr_block}}\"";
        java.util.Map<String, String> props = java.util.Map.of();

        var result = CodeGeneratorService.renderTemplate(template, props);

        assertEquals("cidr = \"\"", result);
    }

    @Test
    void renderTemplate_WithNoVariables_ShouldReturnAsIs() {
        var template = "resource \"aws_vpc\" \"main\" {}";

        var result = CodeGeneratorService.renderTemplate(template, Map.of());

        assertEquals(template, result);
    }

    @Test
    void renderTemplate_WithEmptyTemplate_ShouldReturnEmpty() {
        var result = CodeGeneratorService.renderTemplate("", Map.of("key", "val"));

        assertEquals("", result);
    }

    @Test
    void generateCode_WithDesignId_ShouldPreserveIdInResult() {
        var id = UUID.randomUUID().toString();
        var design = new CanvasDesign(id, "test", List.of(), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");

        assertEquals(id, result.canvasId());
    }

    @Test
    void generateCode_WithProviderNull_ShouldDefaultToAws() {
        var design = new CanvasDesign(UUID.randomUUID().toString(), "test", List.of(), List.of());

        var result = codeGeneratorService.generateCode(design, null, "terraform");

        assertTrue(result.files().get("providers.tf").contains("aws"));
        assertEquals("aws", result.provider());
    }
}
