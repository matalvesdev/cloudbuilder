package com.cloudbuilder.provision.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TerraformImportServiceTest {

    private TerraformImportService importService;

    @BeforeEach
    void setUp() {
        importService = new TerraformImportService();
    }

    @Test
    void parse_EmptyContent_ShouldReturnEmptyWithWarning() {
        var result = importService.parse("");
        assertTrue(result.resources().isEmpty());
        assertFalse(result.warnings().isEmpty());
    }

    @Test
    void parse_NullContent_ShouldReturnEmptyWithWarning() {
        var result = importService.parse(null);
        assertTrue(result.resources().isEmpty());
        assertFalse(result.warnings().isEmpty());
    }

    @Test
    void parse_ValidTerraform_ShouldParseResources() {
        String hcl = """
                resource "aws_vpc" "main" {
                  cidr_block = "10.0.0.0/16"
                  enable_dns_support = true
                  tags = {
                    Name = "main-vpc"
                  }
                }

                resource "aws_subnet" "public" {
                  vpc_id = aws_vpc.main.id
                  cidr_block = "10.0.1.0/24"
                }
                """;
        var result = importService.parse(hcl);
        assertEquals(2, result.resources().size());
        assertEquals(1, result.connections().size());
    }

    @Test
    void parse_ShouldDetectProviderFromType() {
        String hcl = """
                resource "aws_vpc" "main" {
                  cidr_block = "10.0.0.0/16"
                }
                resource "azurerm_resource_group" "rg" {
                  name = "my-rg"
                }
                resource "google_compute_network" "vpc" {
                  name = "my-vpc"
                }
                resource "kubernetes_namespace" "ns" {
                  metadata { name = "my-ns" }
                }
                """;
        var result = importService.parse(hcl);
        assertEquals(4, result.resources().size());
        var awsRes = result.resources().stream().filter(r -> r.provider().equals("aws")).findFirst();
        var azureRes = result.resources().stream().filter(r -> r.provider().equals("azure")).findFirst();
        var gcpRes = result.resources().stream().filter(r -> r.provider().equals("gcp")).findFirst();
        var k8sRes = result.resources().stream().filter(r -> r.provider().equals("k8s")).findFirst();
        assertTrue(awsRes.isPresent());
        assertTrue(azureRes.isPresent());
        assertTrue(gcpRes.isPresent());
        assertTrue(k8sRes.isPresent());
    }

    @Test
    void parse_WithComments_ShouldIgnoreThem() {
        String hcl = """
                # This is a comment
                resource "aws_vpc" "main" {
                  cidr_block = "10.0.0.0/16"
                  // another comment
                  enable_dns_support = true
                }
                /* block comment */
                resource "aws_subnet" "public" {
                  cidr_block = "10.0.1.0/24"
                }
                """;
        var result = importService.parse(hcl);
        assertEquals(2, result.resources().size());
    }

    @Test
    void parse_WithDataSource_ShouldMarkAsDataSource() {
        String hcl = """
                data "aws_vpc" "existing" {
                  id = "vpc-12345"
                }
                """;
        var result = importService.parse(hcl);
        assertEquals(1, result.resources().size());
        assertTrue(result.resources().getFirst().isDataSource());
    }

    @Test
    void parse_WithoutResources_ShouldAddWarning() {
        String hcl = """
                variable "region" {
                  default = "us-east-1"
                }
                """;
        var result = importService.parse(hcl);
        assertTrue(result.resources().isEmpty());
        assertFalse(result.warnings().isEmpty());
    }

    @Test
    void parse_WithModuleRefs_ShouldAddWarning() {
        String hcl = """
                resource "aws_vpc" "main" {
                  cidr_block = module.vpc.vpc_cidr
                }
                """;
        var result = importService.parse(hcl);
        assertTrue(result.warnings().stream().anyMatch(w -> w.contains("módulos") || w.contains("modulos")));
    }

    @Test
    void parse_ComplexAwsResources_ShouldExtractProperties() {
        String hcl = """
                resource "aws_instance" "web" {
                  ami           = "ami-0c55b159cbfafe1f0"
                  instance_type = "t3.medium"
                  subnet_id     = aws_subnet.public.id
                  tags = {
                    Name = "web-server"
                  }
                }
                """;
        var result = importService.parse(hcl);
        assertEquals(1, result.resources().size());
        var resource = result.resources().getFirst();
        assertEquals("web", resource.name());
        assertEquals("aws_instance", resource.resourceType());
        assertEquals("aws", resource.provider());
        assertTrue(resource.properties().containsKey("ami"));
        assertTrue(resource.properties().containsKey("instance_type"));
    }
}
