package com.cloudbuilder.design.domain.validator;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Validates that cross-provider connections are flagged with appropriate warnings.
 * Direct connections between resources from different providers (e.g., AWS -> Azure)
 * are technically possible via VPN/peering but should be reviewed.
 */
@Component
public class CrossProviderCompatibilityRule implements ValidationRule {

    private static final Map<String, Set<String>> PROVIDER_MEMBERS = Map.of(
            "aws", Set.of(
                    "aws_s3_bucket", "aws_instance", "aws_db_instance", "aws_lb",
                    "aws_vpc", "aws_subnet", "aws_security_group", "aws_lb_target_group",
                    "aws_internet_gateway", "aws_nat_gateway", "aws_ecs_cluster",
                    "aws_ecs_service", "aws_ecs_task_definition", "aws_iam_role",
                    "aws_lambda_function", "aws_sqs_queue", "aws_sns_topic",
                    "aws_elasticache_cluster", "aws_rds_cluster"
            ),
            "azure", Set.of(
                    "azure_resource_group", "azure_virtual_network", "azure_subnet",
                    "azure_linux_virtual_machine", "azure_postgresql_flexible_server",
                    "azure_storage_account", "azure_container_registry",
                    "azure_kubernetes_cluster", "azure_app_service", "azure_sql_server",
                    "azure_redis_cache"
            ),
            "gcp", Set.of(
                    "google_compute_network", "google_compute_subnetwork",
                    "google_compute_instance", "google_storage_bucket",
                    "google_container_cluster", "google_cloud_run_service",
                    "google_sql_database_instance", "google_redis_instance",
                    "google_pubsub_topic"
            ),
            "k8s", Set.of(
                    "kubernetes_namespace", "kubernetes_deployment", "kubernetes_service",
                    "kubernetes_config_map", "kubernetes_secret", "kubernetes_stateful_set",
                    "kubernetes_ingress", "kubernetes_persistent_volume_claim"
            )
    );

    @Override
    public String getRuleName() {
        return "crossProviderCompatibility";
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasNode node) {
        return valid(node.getId().toString());
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasEdge edge) {
        Optional<CanvasNode> sourceOpt = findNode(canvas, edge.getSourceNodeId());
        Optional<CanvasNode> targetOpt = findNode(canvas, edge.getTargetNodeId());

        if (sourceOpt.isEmpty() || targetOpt.isEmpty()) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                    "Could not resolve source or target node for cross-provider check",
                    edge.getId().toString());
        }

        String sourceType = sourceOpt.get().getComponentDefinitionId();
        String targetType = targetOpt.get().getComponentDefinitionId();

        String sourceProvider = resolveProvider(sourceType);
        String targetProvider = resolveProvider(targetType);

        if (sourceProvider == null || targetProvider == null) {
            return valid(edge.getId().toString());
        }

        if (sourceProvider.equals(targetProvider)) {
            return valid(edge.getId().toString());
        }

        // Cross-provider connection — flag as warning
        return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                "Cross-provider connection: " + sourceType + " (" + sourceProvider.toUpperCase()
                        + ") -> " + targetType + " (" + targetProvider.toUpperCase()
                        + "). Verify VPN/peering is configured and IAM policies allow cross-provider access.",
                edge.getId().toString());
    }

    private String resolveProvider(String componentType) {
        for (var entry : PROVIDER_MEMBERS.entrySet()) {
            if (entry.getValue().contains(componentType)) {
                return entry.getKey();
            }
        }
        return null;
    }

    private Optional<CanvasNode> findNode(Canvas canvas, String nodeId) {
        return canvas.getCanvasNodes().stream()
                .filter(n -> n.getId().equals(nodeId))
                .findFirst();
    }

    private ValidationResult valid(String componentId) {
        return new ValidationResult(getRuleName(), true, ValidationResult.Severity.INFO,
                "Cross-provider compatibility check passed", componentId);
    }
}
