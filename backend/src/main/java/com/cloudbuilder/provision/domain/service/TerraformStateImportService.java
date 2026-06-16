package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.application.dto.ParsedConnection;
import com.cloudbuilder.provision.application.dto.ParsedResource;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Parser for terraform.tfstate JSON files.
 *
 * The .tfstate format (version 4+) is a JSON document containing an array of
 * "resources", each with one or more "instances" that hold the actual attribute
 * values of the deployed infrastructure.
 *
 * Spec: https://developer.hashicorp.com/terraform/language/state
 */
@Service
public class TerraformStateImportService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    // Provider prefix → CloudBuilder provider
    private static final Map<String, String> PROVIDER_MAP = Map.ofEntries(
        Map.entry("aws", "aws"),
        Map.entry("azurerm", "azure"),
        Map.entry("azuread", "azure"),
        Map.entry("azapi", "azure"),
        Map.entry("google", "gcp"),
        Map.entry("kubernetes", "k8s"),
        Map.entry("helm", "k8s"),
        Map.entry("kubectl", "k8s")
    );

    private static final Map<String, String> DISPLAY_TYPE_MAP = createDisplayTypeMap();
    private static final Map<String, String> COMPONENT_ID_MAP = createComponentIdMap();

    /**
     * Parse a terraform.tfstate JSON string into a list of resources and connections.
     */
    public ImportResult parse(String stateJson) {
        List<String> warnings = new ArrayList<>();
        List<ParsedResource> resources = new ArrayList<>();
        Map<String, ParsedResource> resourceMap = new LinkedHashMap<>();

        if (stateJson == null || stateJson.isBlank()) {
            return new ImportResult(List.of(), List.of(), List.of("Conteúdo vazio"), 0);
        }

        try {
            JsonNode root = MAPPER.readTree(stateJson);

            JsonNode resourcesNode = root.get("resources");
            if (resourcesNode == null || !resourcesNode.isArray()) {
                return new ImportResult(List.of(), List.of(), List.of("Arquivo .tfstate inválido: 'resources' não encontrado"), 0);
            }

            for (JsonNode resNode : resourcesNode) {
                parseResource(resNode, resources, resourceMap, warnings);
            }

            if (resources.isEmpty()) {
                warnings.add("Nenhum recurso encontrado no state file.");
            }

            // Detect connections based on attribute references
            List<ParsedConnection> connections = detectConnections(resources);

            return new ImportResult(resources, connections, warnings, resources.size());

        } catch (Exception e) {
            return new ImportResult(
                List.of(),
                List.of(),
                List.of("Erro ao processar .tfstate: " + e.getMessage()),
                0
            );
        }
    }

    private void parseResource(JsonNode resNode, List<ParsedResource> resources,
                                Map<String, ParsedResource> resourceMap, List<String> warnings) {
        String mode = resNode.has("mode") ? resNode.get("mode").asText() : "managed";
        String type = resNode.has("type") ? resNode.get("type").asText() : "unknown";
        String name = resNode.has("name") ? resNode.get("name").asText() : "unknown";
        String provider = resNode.has("provider") ? resNode.get("provider").asText() : "";

        boolean isDataSource = "data".equals(mode);

        // Resolve provider from the provider string (e.g. "provider[\"registry.terraform.io/hashicorp/aws\"]")
        String resolvedProvider = resolveProviderFromString(provider);
        if (resolvedProvider == null) {
            resolvedProvider = resolveProviderFromType(type);
        }

        String displayType = DISPLAY_TYPE_MAP.getOrDefault(type, type);

        JsonNode instances = resNode.get("instances");
        if (instances == null || !instances.isArray()) {
            warnings.add("Recurso " + type + "." + name + " não possui instances");
            return;
        }

        int instanceIdx = 0;
        for (JsonNode instance : instances) {
            String instanceName = instanceIdx == 0 ? name : name + "[" + instanceIdx + "]";
            Map<String, String> properties = new LinkedHashMap<>();

            if (instance.has("attributes")) {
                extractProperties(instance.get("attributes"), properties, "", 0, warnings);
            }

            ParsedResource resource = new ParsedResource(
                instanceName,
                type,
                resolvedProvider,
                displayType,
                isDataSource,
                properties
            );

            resources.add(resource);
            resourceMap.put(type + "." + instanceName, resource);
            instanceIdx++;
        }
    }

    /**
     * Recursively extract properties from a JSON node, flattening nested objects.
     */
    private void extractProperties(JsonNode node, Map<String, String> props,
                                    String prefix, int depth, List<String> warnings) {
        if (depth > 3) return; // limit recursion depth

        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            String key = field.getKey();
            JsonNode value = field.getValue();
            String fullKey = prefix.isEmpty() ? key : prefix + "." + key;

            if (value.isObject()) {
                // Skip complex objects, but recurse one level for known structures
                if (depth < 2) {
                    extractProperties(value, props, fullKey, depth + 1, warnings);
                }
            } else if (value.isArray()) {
                if (value.size() > 0 && !value.get(0).isObject()) {
                    // Simple array (strings, numbers)
                    List<String> items = new ArrayList<>();
                    for (JsonNode item : value) {
                        items.add(item.asText());
                    }
                    props.put(fullKey, String.join(", ", items));
                }
            } else if (!value.isNull()) {
                props.put(fullKey, value.asText());
            }
        }
    }

    /**
     * Resolve provider from the Terraform provider string format.
     * e.g. "provider[\"registry.terraform.io/hashicorp/aws\"]" → "aws"
     */
    private String resolveProviderFromString(String providerStr) {
        if (providerStr == null || providerStr.isBlank()) return null;
        // Extract just the provider name from the full path
        for (var entry : PROVIDER_MAP.entrySet()) {
            if (providerStr.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String resolveProviderFromType(String resourceType) {
        for (var entry : PROVIDER_MAP.entrySet()) {
            if (resourceType.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "aws"; // default fallback
    }

    /**
     * Detect connections based on attribute values that reference other resources.
     * In state files, references are typically flattened (e.g. "vpc_id" = "vpc-xxxxx").
     * We look for patterns like resource ID values that match known resource types.
     */
    private List<ParsedConnection> detectConnections(List<ParsedResource> resources) {
        List<ParsedConnection> connections = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        // Build a lookup of resource names by ID patterns
        // For state files, we use property conventions to infer connections
        for (ParsedResource resource : resources) {
            for (var entry : resource.properties().entrySet()) {
                String attrKey = entry.getKey();
                String attrValue = entry.getValue();

                // Check for common reference patterns
                // e.g. vpc_id = "vpc-xxxx" → subnet depends on vpc
                if (attrKey.endsWith("_id") && !attrKey.equals("id")) {
                    // Extract the base type from the attribute name
                    String baseType = attrKey.replace("_id", "");
                    String sourceTypePrefix = resource.resourceType();

                    // Find which resource this ID might reference
                    for (ParsedResource target : resources) {
                        if (target == resource) continue;
                        String targetId = target.properties().get("id");
                        if (targetId != null && targetId.equals(attrValue)) {
                            String connKey = resource.resourceType() + "." + resource.name()
                                + "->" + target.resourceType() + "." + target.name();
                            if (seen.add(connKey)) {
                                connections.add(new ParsedConnection(
                                    resource.resourceType() + "." + resource.name(),
                                    target.resourceType() + "." + target.name()
                                ));
                            }
                        } else if (target.resourceType().endsWith("_" + baseType)
                            || target.resourceType().contains(baseType)) {
                            // Heuristic: attr name matches resource type
                            String connKey = resource.resourceType() + "." + resource.name()
                                + "->" + target.resourceType() + "." + target.name();
                            if (seen.add(connKey)) {
                                connections.add(new ParsedConnection(
                                    resource.resourceType() + "." + resource.name(),
                                    target.resourceType() + "." + target.name()
                                ));
                            }
                        }
                    }
                }
            }
        }

        return connections;
    }

    private static Map<String, String> createDisplayTypeMap() {
        Map<String, String> m = new LinkedHashMap<>();
        // AWS
        m.put("aws_vpc", "VPC");
        m.put("aws_subnet", "Subnet");
        m.put("aws_instance", "EC2");
        m.put("aws_security_group", "Security Group");
        m.put("aws_db_instance", "RDS");
        m.put("aws_s3_bucket", "S3 Bucket");
        m.put("aws_lb", "Load Balancer");
        m.put("aws_lb_target_group", "Target Group");
        m.put("aws_ecs_cluster", "ECS Cluster");
        m.put("aws_ecs_service", "ECS Service");
        m.put("aws_ecs_task_definition", "ECS Task Def");
        m.put("aws_eks_cluster", "EKS Cluster");
        m.put("aws_lambda_function", "Lambda");
        m.put("aws_sqs_queue", "SQS Queue");
        m.put("aws_sns_topic", "SNS Topic");
        m.put("aws_dynamodb_table", "DynamoDB");
        m.put("aws_elasticache_cluster", "ElastiCache");
        m.put("aws_rds_cluster", "RDS Cluster");
        m.put("aws_iam_role", "IAM Role");
        m.put("aws_iam_policy", "IAM Policy");
        m.put("aws_route53_zone", "Route53 Zone");
        m.put("aws_api_gateway_rest_api", "API Gateway");
        m.put("aws_cloudfront_distribution", "CloudFront");
        m.put("aws_ecr_repository", "ECR Repo");
        m.put("aws_kms_key", "KMS Key");
        m.put("aws_s3_bucket_policy", "S3 Bucket Policy");
        m.put("aws_route_table", "Route Table");
        m.put("aws_internet_gateway", "Internet Gateway");
        m.put("aws_nat_gateway", "NAT Gateway");
        // Azure
        m.put("azurerm_resource_group", "Resource Group");
        m.put("azurerm_virtual_network", "VNet");
        m.put("azurerm_subnet", "Subnet");
        m.put("azurerm_kubernetes_cluster", "AKS");
        m.put("azurerm_storage_account", "Storage Account");
        m.put("azurerm_sql_database", "SQL DB");
        m.put("azurerm_redis_cache", "Redis");
        m.put("azurerm_application_gateway", "App Gateway");
        m.put("azurerm_key_vault", "Key Vault");
        m.put("azurerm_function_app", "Function App");
        m.put("azurerm_app_service", "App Service");
        m.put("azurerm_cosmosdb_account", "Cosmos DB");
        m.put("azurerm_service_bus_namespace", "Service Bus");
        m.put("azurerm_network_security_group", "NSG");
        // GCP
        m.put("google_compute_network", "VPC");
        m.put("google_compute_subnetwork", "Subnet");
        m.put("google_compute_instance", "Compute Engine");
        m.put("google_container_cluster", "GKE");
        m.put("google_storage_bucket", "Storage Bucket");
        m.put("google_sql_database_instance", "Cloud SQL");
        m.put("google_redis_instance", "Redis");
        m.put("google_cloud_run_service", "Cloud Run");
        m.put("google_bigquery_dataset", "BigQuery");
        m.put("google_pubsub_topic", "Pub/Sub");
        m.put("google_pubsub_subscription", "Pub/Sub Sub");
        m.put("google_compute_firewall", "Firewall");
        m.put("google_compute_address", "Static IP");
        // K8s
        m.put("kubernetes_namespace", "Namespace");
        m.put("kubernetes_deployment", "Deployment");
        m.put("kubernetes_service", "Service");
        m.put("kubernetes_secret", "Secret");
        m.put("kubernetes_config_map", "ConfigMap");
        m.put("kubernetes_persistent_volume_claim", "PVC");
        m.put("kubernetes_ingress", "Ingress");
        m.put("kubernetes_horizontal_pod_autoscaler", "HPA");
        m.put("kubernetes_stateful_set", "StatefulSet");
        m.put("kubernetes_daemon_set", "DaemonSet");
        return Collections.unmodifiableMap(m);
    }

    private static Map<String, String> createComponentIdMap() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("aws_vpc", "aws-vpc");
        m.put("aws_subnet", "aws-subnet");
        m.put("aws_instance", "aws-ec2");
        m.put("aws_security_group", "aws-sg");
        m.put("aws_db_instance", "aws-rds");
        m.put("aws_s3_bucket", "aws-s3");
        m.put("aws_lb", "aws-alb");
        m.put("aws_lb_target_group", "aws-tg");
        m.put("aws_ecs_cluster", "aws-ecs");
        m.put("aws_lambda_function", "aws-lambda");
        m.put("aws_sqs_queue", "aws-sqs");
        m.put("aws_sns_topic", "aws-sns");
        m.put("aws_dynamodb_table", "aws-dynamodb");
        m.put("aws_elasticache_cluster", "aws-elasticache");
        m.put("aws_iam_role", "aws-iam-role");
        m.put("aws_internet_gateway", "aws-igw");
        m.put("aws_nat_gateway", "aws-natgw");
        m.put("aws_route_table", "aws-rtb");
        m.put("aws_kms_key", "aws-kms");
        m.put("azurerm_resource_group", "azure-resource-group");
        m.put("azurerm_virtual_network", "azure-vnet");
        m.put("azurerm_subnet", "azure-subnet");
        m.put("azurerm_kubernetes_cluster", "azure-aks");
        m.put("azurerm_storage_account", "azure-storage");
        m.put("azurerm_sql_database", "azure-sql");
        m.put("azurerm_redis_cache", "azure-redis");
        m.put("azurerm_application_gateway", "azure-appgw");
        m.put("azurerm_key_vault", "azure-key-vault");
        m.put("azurerm_function_app", "azure-func");
        m.put("azurerm_app_service", "azure-app-service");
        m.put("azurerm_cosmosdb_account", "azure-cosmosdb");
        m.put("azurerm_network_security_group", "azure-nsg");
        m.put("google_compute_network", "gcp-vpc");
        m.put("google_compute_subnetwork", "gcp-subnet");
        m.put("google_compute_instance", "gcp-vm");
        m.put("google_container_cluster", "gcp-gke");
        m.put("google_storage_bucket", "gcp-gcs");
        m.put("google_sql_database_instance", "gcp-sql");
        m.put("google_redis_instance", "gcp-redis");
        m.put("google_cloud_run_service", "gcp-cloudrun");
        m.put("google_bigquery_dataset", "gcp-bigquery");
        m.put("google_compute_firewall", "gcp-firewall");
        m.put("google_compute_address", "gcp-address");
        m.put("kubernetes_deployment", "k8s-deploy");
        m.put("kubernetes_service", "k8s-service");
        m.put("kubernetes_namespace", "k8s-namespace");
        m.put("kubernetes_ingress", "k8s-ingress");
        m.put("kubernetes_config_map", "k8s-configmap");
        m.put("kubernetes_secret", "k8s-secret");
        m.put("kubernetes_persistent_volume_claim", "k8s-pvc");
        m.put("kubernetes_horizontal_pod_autoscaler", "k8s-hpa");
        m.put("kubernetes_stateful_set", "k8s-statefulset");
        m.put("kubernetes_daemon_set", "k8s-daemonset");
        return Collections.unmodifiableMap(m);
    }

    /**
     * Result holder for the parse operation.
     */
    public record ImportResult(
        List<ParsedResource> resources,
        List<ParsedConnection> connections,
        List<String> warnings,
        int resourceCount
    ) {}
}
