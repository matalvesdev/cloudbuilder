package com.cloudbuilder.provision.application.dto;

import java.util.Map;

public record ParsedResource(
    String name,
    String resourceType,       // e.g. "aws_vpc", "azurerm_resource_group"
    String provider,           // e.g. "aws", "azure", "gcp", "k8s"
    String displayType,        // e.g. "VPC", "Resource Group"
    boolean isDataSource,      // true if it's a `data` block
    Map<String, String> properties
) {}
