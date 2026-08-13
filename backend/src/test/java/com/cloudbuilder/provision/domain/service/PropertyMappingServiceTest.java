package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import com.cloudbuilder.provision.domain.port.ProviderRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PropertyMappingServiceTest {

    private PropertyMappingService mappingService;

    @BeforeEach
    void setUp() {
        // Create a ProviderAdapter that knows about aws_vpc, aws_instance, aws_subnet,
        // azurerm_virtual_network, google_compute_instance, and kubernetes_deployment
        var adapter = new ProviderAdapter() {
            @Override public String getProviderType() { return "aws"; }
            @Override public String getDisplayName() { return "AWS"; }
            @Override public List<String> getSupportedResourceTypes() {
                return List.of("aws_vpc", "aws_subnet", "aws_instance");
            }
            @Override public String mapToComponentId(String resourceType) {
                return switch (resourceType) {
                    case "aws_vpc" -> "aws-vpc";
                    case "aws_subnet" -> "aws-subnet";
                    case "aws_instance" -> "aws-ec2";
                    default -> resourceType;
                };
            }
            @Override public Map<String, String> getPropertySchema(String resourceType) {
                return switch (resourceType) {
                    case "aws_vpc" -> Map.of(
                        "id", "ID",
                        "cidr_block", "CIDR Block",
                        "instance_tenancy", "Tenancy",
                        "enable_dns_support", "DNS Support"
                    );
                    case "aws_instance" -> Map.of(
                        "id", "ID",
                        "instance_type", "Instance Type",
                        "tags.Name", "Name"
                    );
                    default -> Map.of();
                };
            }
            @Override public boolean supports(String resourceType) {
                return getSupportedResourceTypes().contains(resourceType);
            }
            @Override public String getTerraformProviderSource() { return "hashicorp/aws"; }
            @Override public String getTerraformVersionConstraint() { return "~> 5.0"; }
        };

        var azureAdapter = new ProviderAdapter() {
            @Override public String getProviderType() { return "azure"; }
            @Override public String getDisplayName() { return "Azure"; }
            @Override public List<String> getSupportedResourceTypes() {
                return List.of("azurerm_virtual_network");
            }
            @Override public String mapToComponentId(String resourceType) {
                return "azure-vnet";
            }
            @Override public Map<String, String> getPropertySchema(String resourceType) { return Map.of(); }
            @Override public boolean supports(String resourceType) {
                return getSupportedResourceTypes().contains(resourceType);
            }
            @Override public String getTerraformProviderSource() { return "hashicorp/azurerm"; }
            @Override public String getTerraformVersionConstraint() { return "~> 3.0"; }
        };

        var gcpAdapter = new ProviderAdapter() {
            @Override public String getProviderType() { return "gcp"; }
            @Override public String getDisplayName() { return "GCP"; }
            @Override public List<String> getSupportedResourceTypes() {
                return List.of("google_compute_instance");
            }
            @Override public String mapToComponentId(String resourceType) { return "gcp-vm"; }
            @Override public Map<String, String> getPropertySchema(String resourceType) { return Map.of(); }
            @Override public boolean supports(String resourceType) {
                return getSupportedResourceTypes().contains(resourceType);
            }
            @Override public String getTerraformProviderSource() { return "hashicorp/google"; }
            @Override public String getTerraformVersionConstraint() { return "~> 5.0"; }
        };

        var k8sAdapter = new ProviderAdapter() {
            @Override public String getProviderType() { return "k8s"; }
            @Override public String getDisplayName() { return "Kubernetes"; }
            @Override public List<String> getSupportedResourceTypes() {
                return List.of("kubernetes_deployment");
            }
            @Override public String mapToComponentId(String resourceType) { return "k8s-deploy"; }
            @Override public Map<String, String> getPropertySchema(String resourceType) { return Map.of(); }
            @Override public boolean supports(String resourceType) {
                return getSupportedResourceTypes().contains(resourceType);
            }
            @Override public String getTerraformProviderSource() { return "hashicorp/kubernetes"; }
            @Override public String getTerraformVersionConstraint() { return "~> 2.0"; }
        };

        var providerRegistry = new ProviderRegistry(List.of(adapter, azureAdapter, gcpAdapter, k8sAdapter));
        mappingService = new PropertyMappingService(providerRegistry);
    }

    @Test
    void mapProperties_AwsVpc_ShouldReturnSchemaProperties() {
        var raw = Map.of(
                "id", "vpc-123",
                "cidr_block", "10.0.0.0/16",
                "instance_tenancy", "default",
                "enable_dns_support", "true",
                "extra_field", "ignored"
        );
        var result = mappingService.mapProperties("aws_vpc", raw);
        assertEquals("vpc-123", result.get("ID"));
        assertEquals("10.0.0.0/16", result.get("CIDR Block"));
        assertEquals("default", result.get("Tenancy"));
        assertEquals("true", result.get("DNS Support"));
        assertNull(result.get("extra_field"));
    }

    @Test
    void mapProperties_AwsInstance_ShouldReturnSchemaProperties() {
        var raw = Map.of(
                "id", "i-123",
                "instance_type", "t3.medium",
                "ami", "ami-abc",
                "subnet_id", "subnet-456",
                "tags.Name", "web-server"
        );
        var result = mappingService.mapProperties("aws_instance", raw);
        assertEquals("i-123", result.get("ID"));
        assertEquals("t3.medium", result.get("Instance Type"));
        assertEquals("web-server", result.get("Name"));
    }

    @Test
    void mapProperties_UnknownResourceType_ShouldIncludeFirstFiveRaw() {
        var raw = Map.of(
                "id", "res-1",
                "name", "test",
                "type", "standard",
                "region", "us-east-1",
                "size", "large",
                "extra", "should-not-appear"
        );
        var result = mappingService.mapProperties("unknown_resource", raw);
        assertEquals(5, result.size());
        assertTrue(result.containsKey("id") || result.keySet().stream().anyMatch(k -> k.equals("id")));
    }

    @Test
    void mapProperties_EmptyRaw_ShouldReturnEmpty() {
        var result = mappingService.mapProperties("aws_vpc", Map.of());
        assertTrue(result.isEmpty());
    }

    @Test
    void getComponentId_AwsVpc_ShouldReturnAwsVpc() {
        assertEquals("aws-vpc", mappingService.getComponentId("aws_vpc"));
    }

    @Test
    void getComponentId_AwsSubnet_ShouldReturnAwsSubnet() {
        assertEquals("aws-subnet", mappingService.getComponentId("aws_subnet"));
    }

    @Test
    void getComponentId_AwsInstance_ShouldReturnAwsEc2() {
        assertEquals("aws-ec2", mappingService.getComponentId("aws_instance"));
    }

    @Test
    void getComponentId_AzureVnet_ShouldReturnAzureVnet() {
        assertEquals("azure-vnet", mappingService.getComponentId("azurerm_virtual_network"));
    }

    @Test
    void getComponentId_GcpVm_ShouldReturnGcpVm() {
        assertEquals("gcp-vm", mappingService.getComponentId("google_compute_instance"));
    }

    @Test
    void getComponentId_K8sDeployment_ShouldReturnK8sDeploy() {
        assertEquals("k8s-deploy", mappingService.getComponentId("kubernetes_deployment"));
    }

    @Test
    void getComponentId_Unknown_ShouldReturnResourceType() {
        assertEquals("custom_resource", mappingService.getComponentId("custom_resource"));
    }
}
