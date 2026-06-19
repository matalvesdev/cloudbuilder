package com.cloudbuilder.provision.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TerraformStateImportServiceTest {

    private TerraformStateImportService stateImportService;

    @BeforeEach
    void setUp() {
        stateImportService = new TerraformStateImportService();
    }

    @Test
    void parse_EmptyContent_ShouldReturnEmptyWithWarning() {
        var result = stateImportService.parse("");
        assertTrue(result.resources().isEmpty());
        assertFalse(result.warnings().isEmpty());
    }

    @Test
    void parse_NullContent_ShouldReturnEmptyWithWarning() {
        var result = stateImportService.parse(null);
        assertTrue(result.resources().isEmpty());
        assertFalse(result.warnings().isEmpty());
    }

    @Test
    void parse_ValidStateJson_ShouldParseResources() {
        String state = """
                {
                  "version": 4,
                  "resources": [
                    {
                      "mode": "managed",
                      "type": "aws_vpc",
                      "name": "main",
                      "provider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]",
                      "instances": [
                        {
                          "attributes": {
                            "id": "vpc-123",
                            "cidr_block": "10.0.0.0/16",
                            "enable_dns_support": true
                          }
                        }
                      ]
                    }
                  ]
                }
                """;
        var result = stateImportService.parse(state);
        assertEquals(1, result.resources().size());
        var resource = result.resources().getFirst();
        assertEquals("main", resource.name());
        assertEquals("aws_vpc", resource.resourceType());
        assertEquals("aws", resource.provider());
    }

    @Test
    void parse_WithDataSource_ShouldMarkCorrectly() {
        String state = """
                {
                  "version": 4,
                  "resources": [
                    {
                      "mode": "data",
                      "type": "aws_vpc",
                      "name": "existing",
                      "provider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]",
                      "instances": [
                        {
                          "attributes": {
                            "id": "vpc-456"
                          }
                        }
                      ]
                    }
                  ]
                }
                """;
        var result = stateImportService.parse(state);
        assertTrue(result.resources().getFirst().isDataSource());
    }

    @Test
    void parse_MultipleInstances_ShouldCreateSeparateResources() {
        String state = """
                {
                  "version": 4,
                  "resources": [
                    {
                      "mode": "managed",
                      "type": "aws_instance",
                      "name": "web",
                      "provider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]",
                      "instances": [
                        { "attributes": { "id": "i-001", "instance_type": "t3.micro" } },
                        { "attributes": { "id": "i-002", "instance_type": "t3.micro" } }
                      ]
                    }
                  ]
                }
                """;
        var result = stateImportService.parse(state);
        assertEquals(2, result.resources().size());
    }

    @Test
    void parse_MissingResources_ShouldReturnEmpty() {
        String state = """
                {
                  "version": 4
                }
                """;
        var result = stateImportService.parse(state);
        assertTrue(result.resources().isEmpty());
        assertFalse(result.warnings().isEmpty());
    }

    @Test
    void parse_InvalidJson_ShouldReturnError() {
        var result = stateImportService.parse("invalid json");
        assertTrue(result.resources().isEmpty());
        assertFalse(result.warnings().isEmpty());
    }

    @Test
    void parse_WithConnections_ShouldDetectThem() {
        String state = """
                {
                  "version": 4,
                  "resources": [
                    {
                      "mode": "managed",
                      "type": "aws_vpc",
                      "name": "main",
                      "provider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]",
                      "instances": [
                        { "attributes": { "id": "vpc-123", "cidr_block": "10.0.0.0/16" } }
                      ]
                    },
                    {
                      "mode": "managed",
                      "type": "aws_subnet",
                      "name": "public",
                      "provider": "provider[\\"registry.terraform.io/hashicorp/aws\\"]",
                      "instances": [
                        { "attributes": { "id": "subnet-456", "vpc_id": "vpc-123", "cidr_block": "10.0.1.0/24" } }
                      ]
                    }
                  ]
                }
                """;
        var result = stateImportService.parse(state);
        assertEquals(2, result.resources().size());
        assertFalse(result.connections().isEmpty());
    }
}
