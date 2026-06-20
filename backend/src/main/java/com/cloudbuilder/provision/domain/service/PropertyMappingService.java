package com.cloudbuilder.provision.domain.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps properties from parsed Terraform resources to CloudBuilder canvas component
 * fields. Each known resource type has a schema that defines which properties are
 * relevant for the canvas node display and the PropertiesPanel form.
 */
@Service
public class PropertyMappingService {

    // Resource type → property schema (key → display label)
    private static final Map<String, Map<String, String>> PROPERTY_SCHEMAS = createPropertySchemas();

    public Map<String, String> mapProperties(String resourceType, Map<String, String> rawProperties) {
        Map<String, String> result = new LinkedHashMap<>();
        Map<String, String> schema = PROPERTY_SCHEMAS.get(resourceType);

        if (schema != null) {
            // Extract only the properties defined in the schema, in schema order
            for (var schemaEntry : schema.entrySet()) {
                String rawKey = schemaEntry.getKey();
                String displayLabel = schemaEntry.getValue();
                String value = rawProperties.get(rawKey);
                if (value != null && !value.isBlank()) {
                    result.put(displayLabel, value);
                }
            }
        }

        // If no schema match (unknown type), include first 5 raw properties
        if (result.isEmpty()) {
            int count = 0;
            for (var entry : rawProperties.entrySet()) {
                if (count >= 5) break;
                result.put(entry.getKey(), entry.getValue());
                count++;
            }
        }

        return result;
    }

    public String getComponentId(String resourceType) {
        return switch (resourceType) {
            case "aws_vpc" -> "aws-vpc";
            case "aws_subnet" -> "aws-subnet";
            case "aws_instance" -> "aws-ec2";
            case "aws_security_group" -> "aws-sg";
            case "aws_db_instance" -> "aws-rds";
            case "aws_s3_bucket" -> "aws-s3";
            case "aws_lb" -> "aws-alb";
            case "aws_lb_target_group" -> "aws-tg";
            case "aws_ecs_cluster" -> "aws-ecs";
            case "aws_lambda_function" -> "aws-lambda";
            case "aws_sqs_queue" -> "aws-sqs";
            case "aws_sns_topic" -> "aws-sns";
            case "aws_dynamodb_table" -> "aws-dynamodb";
            case "aws_elasticache_cluster" -> "aws-elasticache";
            case "aws_internet_gateway" -> "aws-igw";
            case "aws_nat_gateway" -> "aws-natgw";
            case "aws_route_table" -> "aws-rtb";
            case "azurerm_virtual_network" -> "azure-vnet";
            case "azurerm_subnet" -> "azure-subnet";
            case "azurerm_kubernetes_cluster" -> "azure-aks";
            case "azurerm_storage_account" -> "azure-storage";
            case "azurerm_sql_database" -> "azure-sql";
            case "google_compute_network" -> "gcp-vpc";
            case "google_compute_subnetwork" -> "gcp-subnet";
            case "google_compute_instance" -> "gcp-vm";
            case "google_container_cluster" -> "gcp-gke";
            case "google_storage_bucket" -> "gcp-gcs";
            case "kubernetes_deployment" -> "k8s-deploy";
            case "kubernetes_service" -> "k8s-service";
            case "kubernetes_namespace" -> "k8s-namespace";
            default -> resourceType;
        };
    }

    private static Map<String, Map<String, String>> createPropertySchemas() {
        Map<String, Map<String, String>> schemas = new LinkedHashMap<>();

        // Default fallback
        schemas.put("default", Map.of("id", "ID"));

        // AWS VPC
        schemas.put("aws_vpc", orderedMap(
            "id", "ID",
            "cidr_block", "CIDR Block",
            "instance_tenancy", "Tenancy",
            "enable_dns_support", "DNS Support",
            "enable_dns_hostnames", "DNS Hostnames",
            "tags.Name", "Name"
        ));

        // AWS Subnet
        schemas.put("aws_subnet", orderedMap(
            "id", "ID",
            "cidr_block", "CIDR Block",
            "availability_zone", "AZ",
            "vpc_id", "VPC ID",
            "map_public_ip_on_launch", "Auto-assign Public IP",
            "tags.Name", "Name"
        ));

        // AWS EC2
        schemas.put("aws_instance", orderedMap(
            "id", "ID",
            "instance_type", "Instance Type",
            "ami", "AMI",
            "subnet_id", "Subnet ID",
            "availability_zone", "AZ",
            "public_ip", "Public IP",
            "private_ip", "Private IP",
            "tags.Name", "Name"
        ));

        // AWS RDS
        schemas.put("aws_db_instance", orderedMap(
            "id", "ID",
            "engine", "Engine",
            "engine_version", "Engine Version",
            "instance_class", "Instance Class",
            "db_name", "Database Name",
            "allocated_storage", "Storage (GB)",
            "storage_type", "Storage Type",
            "multi_az", "Multi-AZ",
            "tags.Name", "Name"
        ));

        // AWS Security Group
        schemas.put("aws_security_group", orderedMap(
            "id", "ID",
            "name", "Name",
            "description", "Description",
            "vpc_id", "VPC ID",
            "tags.Name", "Name"
        ));

        // AWS S3
        schemas.put("aws_s3_bucket", orderedMap(
            "id", "ID",
            "bucket", "Bucket Name",
            "acl", "ACL",
            "region", "Region",
            "tags.Name", "Name"
        ));

        // AWS ALB
        schemas.put("aws_lb", orderedMap(
            "id", "ID",
            "name", "Name",
            "load_balancer_type", "Type",
            "scheme", "Scheme",
            "ip_address_type", "IP Type",
            "vpc_id", "VPC ID",
            "tags.Name", "Name"
        ));

        // AWS Lambda
        schemas.put("aws_lambda_function", orderedMap(
            "id", "ID",
            "function_name", "Function Name",
            "runtime", "Runtime",
            "handler", "Handler",
            "memory_size", "Memory (MB)",
            "timeout", "Timeout (s)",
            "tags.Name", "Name"
        ));

        // AWS ECS Cluster
        schemas.put("aws_ecs_cluster", orderedMap(
            "id", "ID",
            "name", "Name",
            "setting", "Settings",
            "tags.Name", "Name"
        ));

        // AWS DynamoDB
        schemas.put("aws_dynamodb_table", orderedMap(
            "id", "ID",
            "name", "Table Name",
            "billing_mode", "Billing Mode",
            "hash_key", "Partition Key",
            "tags.Name", "Name"
        ));

        // AWS SQS
        schemas.put("aws_sqs_queue", orderedMap(
            "id", "ID",
            "name", "Queue Name",
            "visibility_timeout_seconds", "Visibility Timeout",
            "message_retention_seconds", "Retention",
            "tags.Name", "Name"
        ));

        // AWS ElastiCache
        schemas.put("aws_elasticache_cluster", orderedMap(
            "id", "ID",
            "cluster_id", "Cluster ID",
            "engine", "Engine",
            "node_type", "Node Type",
            "num_cache_nodes", "Node Count",
            "tags.Name", "Name"
        ));

        // AWS IGW
        schemas.put("aws_internet_gateway", orderedMap(
            "id", "ID",
            "vpc_id", "VPC ID",
            "tags.Name", "Name"
        ));

        // AWS Route Table
        schemas.put("aws_route_table", orderedMap(
            "id", "ID",
            "vpc_id", "VPC ID",
            "tags.Name", "Name"
        ));

        // Azure VNet
        schemas.put("azurerm_virtual_network", orderedMap(
            "id", "ID",
            "name", "Name",
            "location", "Location",
            "address_space", "Address Space",
            "tags.Name", "Name"
        ));

        // Azure Subnet
        schemas.put("azurerm_subnet", orderedMap(
            "id", "ID",
            "name", "Name",
            "address_prefixes", "Address Prefixes",
            "virtual_network_name", "VNet Name"
        ));

        // Azure AKS
        schemas.put("azurerm_kubernetes_cluster", orderedMap(
            "id", "ID",
            "name", "Name",
            "location", "Location",
            "kubernetes_version", "K8s Version",
            "dns_prefix", "DNS Prefix",
            "tags.Name", "Name"
        ));

        // GCP VPC
        schemas.put("google_compute_network", orderedMap(
            "id", "ID",
            "name", "Name",
            "auto_create_subnetworks", "Auto Subnets",
            "routing_mode", "Routing Mode"
        ));

        // GCP Compute Engine
        schemas.put("google_compute_instance", orderedMap(
            "id", "ID",
            "name", "Name",
            "machine_type", "Machine Type",
            "zone", "Zone",
            "tags.Name", "Name"
        ));

        // GKE
        schemas.put("google_container_cluster", orderedMap(
            "id", "ID",
            "name", "Name",
            "location", "Location",
            "node_locations", "Node Locations",
            "initial_node_count", "Node Count",
            "tags.Name", "Name"
        ));

        // K8s Deployment
        schemas.put("kubernetes_deployment", orderedMap(
            "id", "ID",
            "metadata.0.name", "Name",
            "spec.0.replicas", "Replicas",
            "metadata.0.namespace", "Namespace"
        ));

        // K8s Service
        schemas.put("kubernetes_service", orderedMap(
            "id", "ID",
            "metadata.0.name", "Name",
            "spec.0.type", "Service Type",
            "metadata.0.namespace", "Namespace"
        ));

        return Map.copyOf(schemas);
    }

    private static Map<String, String> orderedMap(String... entries) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < entries.length; i += 2) {
            map.put(entries[i], entries[i + 1]);
        }
        return map;
    }
}
