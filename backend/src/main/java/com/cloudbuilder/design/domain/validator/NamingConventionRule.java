package com.cloudbuilder.design.domain.validator;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Validates resource naming conventions per provider.
 * AWS: ^[a-zA-Z][a-zA-Z0-9_-]{0,62}$
 * Azure: ^[a-zA-Z0-9-_]{0,63}$
 * GCP: ^[a-z][a-z0-9-]{0,62}$
 * K8s: ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$
 */
@Component
public class NamingConventionRule implements ValidationRule {

    private static final Map<String, Pattern> PROVIDER_PATTERNS = Map.of(
            "aws", Pattern.compile("^[a-zA-Z][a-zA-Z0-9_-]{0,62}$"),
            "azure", Pattern.compile("^[a-zA-Z0-9-_]{0,63}$"),
            "gcp", Pattern.compile("^[a-z][a-z0-9-]{0,62}$"),
            "k8s", Pattern.compile("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$")
    );

    private static final Map<String, String> RESOURCE_TO_PROVIDER = Map.ofEntries(
            Map.entry("aws_s3_bucket", "aws"),
            Map.entry("aws_instance", "aws"),
            Map.entry("aws_db_instance", "aws"),
            Map.entry("aws_lb", "aws"),
            Map.entry("aws_vpc", "aws"),
            Map.entry("aws_subnet", "aws"),
            Map.entry("aws_security_group", "aws"),
            Map.entry("aws_lb_target_group", "aws"),
            Map.entry("aws_internet_gateway", "aws"),
            Map.entry("aws_nat_gateway", "aws"),
            Map.entry("aws_ecs_cluster", "aws"),
            Map.entry("aws_ecs_service", "aws"),
            Map.entry("aws_ecs_task_definition", "aws"),
            Map.entry("aws_iam_role", "aws"),
            Map.entry("aws_lambda_function", "aws"),
            Map.entry("aws_sqs_queue", "aws"),
            Map.entry("aws_sns_topic", "aws"),
            Map.entry("aws_elasticache_cluster", "aws"),
            Map.entry("aws_rds_cluster", "aws"),

            Map.entry("azure_resource_group", "azure"),
            Map.entry("azure_virtual_network", "azure"),
            Map.entry("azure_subnet", "azure"),
            Map.entry("azure_linux_virtual_machine", "azure"),
            Map.entry("azure_postgresql_flexible_server", "azure"),
            Map.entry("azure_storage_account", "azure"),
            Map.entry("azure_container_registry", "azure"),
            Map.entry("azure_kubernetes_cluster", "azure"),
            Map.entry("azure_app_service", "azure"),
            Map.entry("azure_sql_server", "azure"),
            Map.entry("azure_redis_cache", "azure"),

            Map.entry("google_compute_network", "gcp"),
            Map.entry("google_compute_subnetwork", "gcp"),
            Map.entry("google_compute_instance", "gcp"),
            Map.entry("google_storage_bucket", "gcp"),
            Map.entry("google_container_cluster", "gcp"),
            Map.entry("google_cloud_run_service", "gcp"),
            Map.entry("google_sql_database_instance", "gcp"),
            Map.entry("google_redis_instance", "gcp"),
            Map.entry("google_pubsub_topic", "gcp"),

            Map.entry("kubernetes_namespace", "k8s"),
            Map.entry("kubernetes_deployment", "k8s"),
            Map.entry("kubernetes_service", "k8s"),
            Map.entry("kubernetes_config_map", "k8s"),
            Map.entry("kubernetes_secret", "k8s"),
            Map.entry("kubernetes_stateful_set", "k8s"),
            Map.entry("kubernetes_ingress", "k8s"),
            Map.entry("kubernetes_persistent_volume_claim", "k8s")
    );

    private static final Set<String> NAME_RESOURCE_TYPES = Set.of(
            "aws_s3_bucket",
            "aws_instance",
            "aws_db_instance",
            "aws_lb",
            "azure_virtual_network",
            "azure_storage_account",
            "google_storage_bucket",
            "google_compute_instance",
            "kubernetes_deployment",
            "kubernetes_service",
            "kubernetes_namespace",
            "kubernetes_config_map"
    );

    private final ObjectMapper objectMapper;

    public NamingConventionRule(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String getRuleName() {
        return "namingConvention";
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasNode node) {
        String resourceType = node.getComponentDefinitionId();
        String provider = RESOURCE_TO_PROVIDER.get(resourceType);
        if (provider == null) {
            return valid(node.getId().toString());
        }

        Pattern pattern = PROVIDER_PATTERNS.get(provider);
        if (pattern == null) {
            return valid(node.getId().toString());
        }

        Map<String, Object> props = parseProperties(node.getProperties());
        if (props == null) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                    "Could not parse properties for naming convention check on " + resourceType,
                    node.getId().toString());
        }

        String name = getNameField(props, resourceType);
        if (name == null || name.isBlank()) {
            if (NAME_RESOURCE_TYPES.contains(resourceType)) {
                return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                        resourceType + " is missing a name/label for naming convention validation",
                        node.getId().toString());
            }
            return valid(node.getId().toString());
        }

        if (!pattern.matcher(name).matches()) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                    resourceType + " name '" + name + "' does not follow " + provider.toUpperCase()
                            + " naming convention: " + pattern.pattern(),
                    node.getId().toString());
        }

        return valid(node.getId().toString());
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasEdge edge) {
        return valid(edge.getId().toString());
    }

    private String getNameField(Map<String, Object> props, String resourceType) {
        // Try common name fields
        for (String key : new String[]{"name", "bucket", "cluster_name", "namespace", "app_name", "function_name"}) {
            Object val = props.get(key);
            if (val != null && !val.toString().isBlank()) {
                return val.toString().trim();
            }
        }
        return null;
    }

    private ValidationResult valid(String componentId) {
        return new ValidationResult(getRuleName(), true, ValidationResult.Severity.INFO,
                "Naming convention check passed", componentId);
    }

    private Map<String, Object> parseProperties(String propertiesJson) {
        if (propertiesJson == null || propertiesJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(propertiesJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return null;
        }
    }
}
