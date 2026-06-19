package com.cloudbuilder.provision.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PropertyMappingServiceTest {

    private PropertyMappingService mappingService;

    @BeforeEach
    void setUp() {
        mappingService = new PropertyMappingService();
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
