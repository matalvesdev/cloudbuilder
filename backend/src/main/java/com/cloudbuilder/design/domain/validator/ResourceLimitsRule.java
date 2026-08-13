package com.cloudbuilder.design.domain.validator;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Function;

/**
 * Validates resource limits are within provider quotas.
 * Hard limits = ERROR, soft limits = WARNING.
 */
@Component
public class ResourceLimitsRule implements ValidationRule {

    private static final Map<String, Map<String, LimitDef>> RESOURCE_LIMITS = Map.ofEntries(
            // ── AWS Limits ──────────────────────────────────────────
            Map.entry("aws_instance", Map.of(
                    "instance_type", new LimitDef("instance_type", val -> {
                        String[] parts = val.toString().split("\\.");
                        return parts.length >= 2 && !val.toString().isBlank();
                    }, true, "Invalid instance_type format (expected: family.size e.g. t3.micro)")
            )),
            Map.entry("aws_s3_bucket", Map.of(
                    "bucket", new LimitDef("bucket", val -> val.toString().length() >= 3 && val.toString().length() <= 63,
                            true, "S3 bucket name must be between 3 and 63 characters")
            )),
            Map.entry("aws_lb", Map.of(
                    "name", new LimitDef("name", val -> val.toString().length() <= 32,
                            false, "ALB/NLB name must be 32 characters or fewer")
            )),
            Map.entry("aws_db_instance", Map.of(
                    "instance_class", new LimitDef("instance_class", val -> {
                        String v = val.toString().toLowerCase();
                        return v.startsWith("db.") || v.startsWith("db.");
                    }, true, "Invalid instance_class format (expected: db.t3.micro)")
            )),
            Map.entry("aws_ecs_cluster", Map.of(
                    "cluster_name", new LimitDef("cluster_name", val -> val.toString().length() <= 255,
                            false, "ECS cluster name must be 255 characters or fewer")
            )),
            Map.entry("aws_lambda_function", Map.of(
                    "function_name", new LimitDef("function_name", val -> val.toString().length() <= 64,
                            false, "Lambda function name must be 64 characters or fewer"),
                    "timeout", new LimitDef("timeout", val -> {
                        try { return Integer.parseInt(val.toString()) <= 900; }
                        catch (NumberFormatException e) { return true; }
                    }, true, "Lambda timeout must not exceed 900 seconds (15 minutes)")
            )),

            // ── Azure Limits ────────────────────────────────────────
            Map.entry("azure_storage_account", Map.of(
                    "name", new LimitDef("name", val -> {
                        String v = val.toString();
                        return v.length() >= 3 && v.length() <= 24 && v.matches("^[a-z0-9]+$");
                    }, true, "Azure storage account name must be 3-24 lowercase alphanumeric characters")
            )),
            Map.entry("azure_linux_virtual_machine", Map.of(
                    "name", new LimitDef("name", val -> val.toString().length() <= 64,
                            false, "Azure VM name must be 64 characters or fewer"),
                    "size", new LimitDef("size", val -> !val.toString().isBlank(),
                            true, "Azure VM size must be specified (e.g. Standard_B2s)")
            )),

            // ── GCP Limits ──────────────────────────────────────────
            Map.entry("google_storage_bucket", Map.of(
                    "name", new LimitDef("name", val -> {
                        String v = val.toString();
                        return v.length() >= 3 && v.length() <= 63;
                    }, true, "GCS bucket name must be between 3 and 63 characters")
            )),
            Map.entry("google_compute_instance", Map.of(
                    "name", new LimitDef("name", val -> val.toString().length() <= 63,
                            false, "GCE instance name must be 63 characters or fewer")
            )),

            // ── K8s Limits ──────────────────────────────────────────
            Map.entry("kubernetes_deployment", Map.of(
                    "name", new LimitDef("name", val -> val.toString().length() <= 253,
                            false, "K8s deployment name must be 253 characters or fewer")
            )),
            Map.entry("kubernetes_namespace", Map.of(
                    "name", new LimitDef("name", val -> val.toString().length() <= 63,
                            false, "K8s namespace name must be 63 characters or fewer")
            )),
            Map.entry("kubernetes_service", Map.of(
                    "name", new LimitDef("name", val -> val.toString().length() <= 63,
                            false, "K8s service name must be 63 characters or fewer")
            )),
            Map.entry("kubernetes_config_map", Map.of(
                    "name", new LimitDef("name", val -> val.toString().length() <= 253,
                            false, "K8s ConfigMap name must be 253 characters or fewer")
            ))
    );

    private final ObjectMapper objectMapper;

    public ResourceLimitsRule(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String getRuleName() {
        return "resourceLimits";
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasNode node) {
        String resourceType = node.getComponentDefinitionId();
        Map<String, LimitDef> limits = RESOURCE_LIMITS.get(resourceType);
        if (limits == null) {
            return valid(node.getId().toString());
        }

        Map<String, Object> props = parseProperties(node.getProperties());
        if (props == null) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                    "Could not parse properties for resource limit check on " + resourceType,
                    node.getId().toString());
        }

        for (LimitDef limit : limits.values()) {
            Object value = props.get(limit.fieldName);
            if (value == null || value.toString().isBlank()) {
                if (limit.required) {
                    return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                            resourceType + "." + limit.fieldName + " is required",
                            node.getId().toString());
                }
                continue;
            }
            if (!limit.validator.apply(value)) {
                boolean isError = limit.required;
                return new ValidationResult(getRuleName(), false,
                        isError ? ValidationResult.Severity.ERROR : ValidationResult.Severity.WARNING,
                        resourceType + " " + limit.message,
                        node.getId().toString());
            }
        }

        return valid(node.getId().toString());
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasEdge edge) {
        return valid(edge.getId().toString());
    }

    private ValidationResult valid(String componentId) {
        return new ValidationResult(getRuleName(), true, ValidationResult.Severity.INFO,
                "Resource limits check passed", componentId);
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

    private record LimitDef(String fieldName, Function<Object, Boolean> validator, boolean required, String message) {}
}
