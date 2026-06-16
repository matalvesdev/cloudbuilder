package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.application.dto.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TerraformImportService {

    // Pattern to match: resource "type" "name" { ... } or data "type" "name" { ... }
    private static final Pattern BLOCK_HEADER = Pattern.compile(
        "^(resource|data)\\s+\"([^\"]+)\"\\s+\"([^\"]+)\"\\s*\\{",
        Pattern.MULTILINE
    );

    // Pattern to match simple attributes: key = "value" or key = <<-EOF ... EOF
    private static final Pattern ATTR_SIMPLE = Pattern.compile(
        "\\s*(\\w+)\\s*=\\s*\"([^\"]*)\""
    );

    // Pattern to match references like aws_vpc.main.id
    private static final Pattern REF_PATTERN = Pattern.compile(
        "\\b([a-zA-Z]\\w+)\\.([a-zA-Z]\\w+)\\.[a-zA-Z]\\w+\\b"
    );

    // Map Terraform resource type prefix → CloudBuilder provider
    private static final Map<String, String> PROVIDER_MAP = Map.ofEntries(
        Map.entry("aws_", "aws"),
        Map.entry("azurerm_", "azure"),
        Map.entry("azuread_", "azure"),
        Map.entry("azapi_", "azure"),
        Map.entry("google_", "gcp"),
        Map.entry("gcp_", "gcp"),
        Map.entry("kubernetes_", "k8s"),
        Map.entry("helm_", "k8s"),
        Map.entry("kubectl_", "k8s"),
        Map.entry("istio_", "k8s"),
        Map.entry("rancher_", "k8s")
    );

    // Friendly display names for common resource types
    private static final Map<String, String> DISPLAY_TYPE_MAP = createDisplayTypeMap();

    // CloudBuilder component definition IDs for known resources
    private static final Map<String, String> COMPONENT_ID_MAP = createComponentIdMap();

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
        m.put("aws_alb", "ALB");
        m.put("aws_nlb", "NLB");
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
        // Azure
        m.put("azurerm_resource_group", "Resource Group");
        m.put("azurerm_virtual_network", "VNet");
        m.put("azurerm_subnet", "Subnet");
        m.put("azurerm_network_interface", "NIC");
        m.put("azurerm_public_ip", "Public IP");
        m.put("azurerm_linux_virtual_machine", "Linux VM");
        m.put("azurerm_windows_virtual_machine", "Windows VM");
        m.put("azurerm_kubernetes_cluster", "AKS");
        m.put("azurerm_container_registry", "ACR");
        m.put("azurerm_storage_account", "Storage Account");
        m.put("azurerm_sql_database", "SQL DB");
        m.put("azurerm_redis_cache", "Redis");
        m.put("azurerm_application_gateway", "App Gateway");
        m.put("azurerm_cosmosdb_account", "Cosmos DB");
        m.put("azurerm_key_vault", "Key Vault");
        m.put("azurerm_service_bus_namespace", "Service Bus");
        m.put("azurerm_function_app", "Function App");
        m.put("azurerm_app_service", "App Service");
        // GCP
        m.put("google_compute_network", "VPC");
        m.put("google_compute_subnetwork", "Subnet");
        m.put("google_compute_instance", "Compute Engine");
        m.put("google_container_cluster", "GKE");
        m.put("google_storage_bucket", "Storage Bucket");
        m.put("google_sql_database_instance", "Cloud SQL");
        m.put("google_redis_instance", "Redis");
        m.put("google_cloud_run_service", "Cloud Run");
        m.put("google_functions_function", "Cloud Function");
        m.put("google_bigquery_dataset", "BigQuery");
        m.put("google_bigquery_table", "BigQuery Table");
        m.put("google_pubsub_topic", "Pub/Sub");
        m.put("google_pubsub_subscription", "Pub/Sub Sub");
        m.put("google_compute_firewall", "Firewall");
        m.put("google_compute_address", "Static IP");
        m.put("google_artifact_registry_repository", "Artifact Registry");
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
        m.put("aws_security_group", "aws-security-group");
        m.put("aws_db_instance", "aws-rds");
        m.put("aws_s3_bucket", "aws-s3");
        m.put("aws_lb", "aws-alb");
        m.put("aws_alb", "aws-alb");
        m.put("aws_ecs_cluster", "aws-ecs");
        m.put("aws_ecs_service", "aws-ecs-service");
        m.put("aws_lambda_function", "aws-lambda");
        m.put("aws_sqs_queue", "aws-sqs");
        m.put("aws_sns_topic", "aws-sns");
        m.put("aws_dynamodb_table", "aws-dynamodb");
        m.put("aws_elasticache_cluster", "aws-elasticache");
        m.put("aws_iam_role", "aws-iam-role");
        m.put("aws_iam_policy", "aws-iam-policy");
        m.put("azurerm_resource_group", "azure-resource-group");
        m.put("azurerm_virtual_network", "azure-vnet");
        m.put("azurerm_subnet", "azure-subnet");
        m.put("azurerm_kubernetes_cluster", "azure-aks");
        m.put("azurerm_storage_account", "azure-storage-account");
        m.put("azurerm_sql_database", "azure-sql-database");
        m.put("azurerm_redis_cache", "azure-redis");
        m.put("azurerm_cosmosdb_account", "azure-cosmosdb");
        m.put("google_compute_instance", "gcp-compute-engine");
        m.put("google_container_cluster", "gcp-gke");
        m.put("google_storage_bucket", "gcp-storage-bucket");
        m.put("google_sql_database_instance", "gcp-cloud-sql");
        m.put("google_cloud_run_service", "gcp-cloud-run");
        m.put("google_bigquery_dataset", "gcp-bigquery");
        m.put("kubernetes_deployment", "k8s-deployment");
        m.put("kubernetes_service", "k8s-service");
        m.put("kubernetes_namespace", "k8s-namespace");
        m.put("kubernetes_ingress", "k8s-ingress");
        m.put("kubernetes_config_map", "k8s-configmap");
        return Collections.unmodifiableMap(m);
    }

    public ImportTerraformResponse parse(String hclContent) {
        if (hclContent == null || hclContent.isBlank()) {
            return new ImportTerraformResponse(List.of(), List.of(), List.of("Conteúdo vazio"), 0);
        }

        List<String> warnings = new ArrayList<>();

        // Remove comments
        String cleaned = removeComments(hclContent);

        // Extract blocks with balanced braces
        List<ParsedResource> resources = new ArrayList<>();
        Map<String, ParsedResource> resourceMap = new LinkedHashMap<>();
        Map<String, Integer> bracePositions = findBlockPositions(cleaned);

        // Match block headers and use brace positions to extract content
        Matcher headerMatcher = BLOCK_HEADER.matcher(cleaned);
        while (headerMatcher.find()) {
            String blockType = headerMatcher.group(1); // "resource" or "data"
            String fullType = headerMatcher.group(2);  // e.g. "aws_vpc"
            String blockName = headerMatcher.group(3); // e.g. "main"
            int blockStart = headerMatcher.start();
            int braceOpen = cleaned.indexOf('{', headerMatcher.start());

            if (braceOpen == -1 || braceOpen >= cleaned.length()) continue;

            int braceClose = findMatchingBrace(cleaned, braceOpen);
            if (braceClose == -1) {
                warnings.add("Bloco " + fullType + "." + blockName + " não foi fechado corretamente");
                continue;
            }

            String blockContent = cleaned.substring(braceOpen + 1, braceClose).trim();
            boolean isDataSource = "data".equals(blockType);

            // Determine provider from resource type prefix
            String provider = resolveProvider(fullType);
            String displayType = DISPLAY_TYPE_MAP.getOrDefault(fullType, fullType);
            String componentId = COMPONENT_ID_MAP.getOrDefault(fullType, fullType);

            // Extract simple attributes
            Map<String, String> properties = new LinkedHashMap<>();
            Matcher attrMatcher = ATTR_SIMPLE.matcher(blockContent);
            while (attrMatcher.find()) {
                String key = attrMatcher.group(1);
                String value = attrMatcher.group(2);
                if (key.equals("provider")) continue; // skip meta-attributes
                if (!key.startsWith("_")) {
                    properties.put(key, value.length() > 80 ? value.substring(0, 80) + "..." : value);
                }
            }

            ParsedResource resource = new ParsedResource(
                blockName,
                fullType,
                provider,
                displayType,
                isDataSource,
                properties
            );

            resources.add(resource);
            resourceMap.put(fullType + "." + blockName, resource);
        }

        if (resources.isEmpty()) {
            warnings.add("Nenhum recurso Terraform encontrado. Verifique se o conteúdo contém blocos `resource`.");
        }

        // Detect connections between resources via references
        List<ParsedConnection> connections = detectConnections(cleaned, resourceMap);

        // Check for unparseable references (modules, etc.)
        if (cleaned.contains("module.")) {
            warnings.add("Referências a módulos detectadas. Módulos não são importados como nós individuais.");
        }

        return new ImportTerraformResponse(resources, connections, warnings, resources.size());
    }

    private String removeComments(String hcl) {
        // Remove line comments (# and //)
        String result = hcl.replaceAll("#[^\n]*", "\n");
        result = result.replaceAll("//[^\n]*", "\n");
        // Remove block comments /* ... */
        result = result.replaceAll("/\\*[\\s\\S]*?\\*/", "");
        return result;
    }

    /**
     * Find matching closing brace for an opening brace at index openPos
     */
    private int findMatchingBrace(String content, int openPos) {
        if (openPos >= content.length() || content.charAt(openPos) != '{') return -1;
        int depth = 1;
        int pos = openPos + 1;
        // Track if we're inside a string to avoid counting braces in string values
        boolean inString = false;
        while (pos < content.length() && depth > 0) {
            char c = content.charAt(pos);
            if (c == '"' && (pos == 0 || content.charAt(pos - 1) != '\\')) {
                inString = !inString;
            } else if (!inString) {
                if (c == '{') depth++;
                else if (c == '}') depth--;
            }
            pos++;
        }
        return depth == 0 ? pos - 1 : -1;
    }

    /**
     * Find all top-level block positions (for validation/overview)
     */
    private Map<String, Integer> findBlockPositions(String content) {
        Map<String, Integer> positions = new LinkedHashMap<>();
        int searchFrom = 0;
        while (searchFrom < content.length()) {
            int braceIdx = content.indexOf('{', searchFrom);
            if (braceIdx == -1) break;
            // Walk backwards to find the block header
            int lineStart = content.lastIndexOf('\n', braceIdx);
            if (lineStart == -1) lineStart = 0;
            int closeBrace = findMatchingBrace(content, braceIdx);
            if (closeBrace == -1) break;
            searchFrom = closeBrace + 1;
        }
        return positions;
    }

    /**
     * Resolve Terraform resource type to CloudBuilder provider
     */
    private String resolveProvider(String resourceType) {
        for (var entry : PROVIDER_MAP.entrySet()) {
            if (resourceType.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "aws"; // default fallback
    }

    /**
     * Detect connections between resources by finding references in attribute values
     */
    private List<ParsedConnection> detectConnections(String content, Map<String, ParsedResource> resourceMap) {
        List<ParsedConnection> connections = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        Matcher refMatcher = REF_PATTERN.matcher(content);
        while (refMatcher.find()) {
            String typePrefix = refMatcher.group(1);    // e.g. "aws_vpc"
            String instanceName = refMatcher.group(2);  // e.g. "main"
            String reference = typePrefix + "." + instanceName;

            // Look backwards to find which resource this reference belongs to
            int refPos = refMatcher.start();
            String containingBlock = findContainingResource(content, refPos, resourceMap);

            if (containingBlock != null && !containingBlock.equals(reference)) {
                // Check it's a valid reference (target exists)
                if (resourceMap.containsKey(reference) || isLikelyReference(typePrefix, instanceName)) {
                    String connectionKey = containingBlock + "->" + reference;
                    if (seen.add(connectionKey)) {
                        // Source is the one that CONTAINS the reference
                        String sourceName = containingBlock;
                        String targetName = reference;
                        connections.add(new ParsedConnection(sourceName, targetName));
                    }
                }
            }
        }

        return connections;
    }

    /**
     * Find which resource block contains a given position in the text
     */
    private String findContainingResource(String content, int position, Map<String, ParsedResource> resourceMap) {
        // Walk backwards from position to find the nearest opening resource/data block
        int searchFrom = Math.max(0, position - 5000); // limit search scope
        String searchArea = content.substring(searchFrom, position);
        Matcher m = BLOCK_HEADER.matcher(searchArea);
        String lastMatch = null;
        while (m.find()) {
            String fullType = m.group(2);
            String blockName = m.group(3);
            lastMatch = fullType + "." + blockName;
        }
        if (lastMatch != null && resourceMap.containsKey(lastMatch)) {
            return lastMatch;
        }
        return null;
    }

    /**
     * Check if a reference is worth creating a connection for
     */
    private boolean isLikelyReference(String typePrefix, String instanceName) {
        // Check if it looks like a resource reference (e.g. aws_vpc.main)
        return typePrefix.matches("[a-z]+_[a-z_]+") && instanceName.matches("[a-zA-Z_]\\w*");
    }
}
