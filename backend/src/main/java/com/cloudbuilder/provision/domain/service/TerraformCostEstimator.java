package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.cost.domain.model.CostScenario;
import com.cloudbuilder.cost.domain.service.CostScenarioService;
import com.cloudbuilder.shared.security.TenantContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Estimates monthly infrastructure costs from Terraform resource definitions.
 * <p>
 * Uses built-in pricing tables for AWS, Azure, GCP, and K8s resources.
 * Each resource type maps to a base monthly cost with min/avg/max tiers.
 * <p>
 * Integration points:
 * - Parses .tf files via TerraformImportService
 * - Persists estimates as CostScenario via CostScenarioService
 * - Works with both canvas-generated and GitHub-imported designs
 */
@Service
public class TerraformCostEstimator {

    private static final Logger log = LoggerFactory.getLogger(TerraformCostEstimator.class);

    private final CostScenarioService costScenarioService;
    private final ObjectMapper objectMapper;

    // Estimated monthly costs in USD by resource type prefix (min, avg, max)
    private static final Map<String, double[]> PRICING_TABLE = createPricingTable();

    public TerraformCostEstimator(CostScenarioService costScenarioService,
                                   ObjectMapper objectMapper) {
        this.costScenarioService = costScenarioService;
        this.objectMapper = objectMapper;
    }

    /**
     * Estimate costs for a list of Terraform resource types and persist as a CostScenario.
     *
     * @param tenantId           the tenant ID
     * @param environmentId      the environment ID
     * @param canvasId           the canvas ID (or "github-import" for reverse imports)
     * @param name               scenario name
     * @param resourceTypes      list of Terraform resource type names (e.g. "aws_vpc", "aws_instance")
     * @return the persisted CostScenario with estimates
     */
    public CostScenario estimateFromResourceTypes(String tenantId, String environmentId,
                                                   String canvasId, String name,
                                                   List<String> resourceTypes) {
        double[] totals = {0, 0, 0}; // min, avg, max
        List<Map<String, Object>> breakdown = new ArrayList<>();
        Map<String, CostCategory> categoryMap = new LinkedHashMap<>();

        for (String resourceType : resourceTypes) {
            String prefix = resolvePrefix(resourceType);
            double[] prices = PRICING_TABLE.getOrDefault(prefix, new double[]{10, 25, 50});

            categoryMap.computeIfAbsent(prefix, k -> new CostCategory(k, 0, 0, 0, 0));
            CostCategory cat = categoryMap.get(prefix);
            cat.count++;
            cat.minTotal += prices[0];
            cat.avgTotal += prices[1];
            cat.maxTotal += prices[2];

            totals[0] += prices[0];
            totals[1] += prices[1];
            totals[2] += prices[2];
        }

        // Build breakdown JSON
        for (CostCategory cat : categoryMap.values()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("category", cat.name);
            entry.put("count", cat.count);
            entry.put("minTotal", Math.round(cat.minTotal * 100.0) / 100.0);
            entry.put("avgTotal", Math.round(cat.avgTotal * 100.0) / 100.0);
            entry.put("maxTotal", Math.round(cat.maxTotal * 100.0) / 100.0);
            breakdown.add(entry);
        }

        String breakdownJson;
        try {
            breakdownJson = objectMapper.writeValueAsString(breakdown);
        } catch (JsonProcessingException e) {
            breakdownJson = "[]";
        }

        int resourceCount = resourceTypes.size();
        double proposedTotal = Math.round(totals[1] * 100.0) / 100.0; // avg tier as proposed

        String tier = "avg";

        String effectiveTenant = tenantId != null ? tenantId :
                (TenantContext.getTenantId() != null ? TenantContext.getTenantId() : "default");

        CostScenario scenario = new CostScenario(
                effectiveTenant, name, environmentId, canvasId,
                tier, 0, proposedTotal, resourceCount, breakdownJson
        );

        CostScenario saved = costScenarioService.create(scenario);
        log.info("Custo estimado para '{}': ${}/mês ({} recursos, {} categorias)",
                name, proposedTotal, resourceCount, breakdown.size());

        return saved;
    }

    /**
     * Convenience method to estimate from a list of ParsedResource objects.
     */
    public CostScenario estimateFromParsedResources(String tenantId, String environmentId,
                                                     String canvasId, String name,
                                                     List<com.cloudbuilder.provision.application.dto.ParsedResource> resources) {
        List<String> resourceTypes = resources.stream()
                .map(com.cloudbuilder.provision.application.dto.ParsedResource::resourceType)
                .toList();
        return estimateFromResourceTypes(tenantId, environmentId, canvasId, name, resourceTypes);
    }

    /**
     * Get estimated cost details for display without persisting.
     */
    public Map<String, Object> getEstimatePreview(List<String> resourceTypes) {
        double[] totals = {0, 0, 0};
        List<Map<String, Object>> breakdown = new ArrayList<>();
        Map<String, CostCategory> categoryMap = new LinkedHashMap<>();

        for (String resourceType : resourceTypes) {
            String prefix = resolvePrefix(resourceType);
            double[] prices = PRICING_TABLE.getOrDefault(prefix, new double[]{10, 25, 50});

            categoryMap.computeIfAbsent(prefix, k -> new CostCategory(k, 0, 0, 0, 0));
            CostCategory cat = categoryMap.get(prefix);
            cat.count++;
            cat.minTotal += prices[0];
            cat.avgTotal += prices[1];
            cat.maxTotal += prices[2];

            totals[0] += prices[0];
            totals[1] += prices[1];
            totals[2] += prices[2];
        }

        for (CostCategory cat : categoryMap.values()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("category", cat.name);
            entry.put("count", cat.count);
            entry.put("min", Math.round(cat.minTotal * 100.0) / 100.0);
            entry.put("avg", Math.round(cat.avgTotal * 100.0) / 100.0);
            entry.put("max", Math.round(cat.maxTotal * 100.0) / 100.0);
            breakdown.add(entry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalMin", Math.round(totals[0] * 100.0) / 100.0);
        result.put("totalAvg", Math.round(totals[1] * 100.0) / 100.0);
        result.put("totalMax", Math.round(totals[2] * 100.0) / 100.0);
        result.put("resourceCount", resourceTypes.size());
        result.put("breakdown", breakdown);
        return result;
    }

    private String resolvePrefix(String resourceType) {
        if (resourceType == null) return "other";
        if (resourceType.startsWith("aws_")) return "aws";
        if (resourceType.startsWith("azurerm_") || resourceType.startsWith("azuread_") || resourceType.startsWith("azapi_"))
            return "azure";
        if (resourceType.startsWith("google_") || resourceType.startsWith("gcp_"))
            return "gcp";
        if (resourceType.startsWith("kubernetes_") || resourceType.startsWith("helm_") || resourceType.startsWith("kubectl_"))
            return "k8s";
        return "other";
    }

    private static Map<String, double[]> createPricingTable() {
        Map<String, double[]> p = new LinkedHashMap<>();

        // AWS — monthly estimates in USD (min, avg, max)
        p.put("aws_vpc", new double[]{0, 0, 0});              // VPC itself is free
        p.put("aws_subnet", new double[]{0, 0, 0});
        p.put("aws_instance", new double[]{25, 50, 200});     // EC2 t3.medium → m5.xlarge
        p.put("aws_security_group", new double[]{0, 0, 0});
        p.put("aws_db_instance", new double[]{50, 150, 500});// RDS db.t3.small → db.r5.large
        p.put("aws_s3_bucket", new double[]{5, 15, 50});
        p.put("aws_lb", new double[]{20, 25, 30});           // ALB
        p.put("aws_alb", new double[]{20, 25, 30});
        p.put("aws_ecs_cluster", new double[]{0, 0, 0});     // Fargate: pay per task
        p.put("aws_ecs_service", new double[]{0, 0, 0});
        p.put("aws_eks_cluster", new double[]{73, 73, 73});  // EKS control plane
        p.put("aws_lambda_function", new double[]{0, 5, 20});
        p.put("aws_sqs_queue", new double[]{0, 1, 5});
        p.put("aws_sns_topic", new double[]{0, 1, 5});
        p.put("aws_dynamodb_table", new double[]{10, 30, 100});
        p.put("aws_elasticache_cluster", new double[]{20, 50, 200});
        p.put("aws_rds_cluster", new double[]{100, 250, 800});
        p.put("aws_iam_role", new double[]{0, 0, 0});
        p.put("aws_iam_policy", new double[]{0, 0, 0});
        p.put("aws_route53_zone", new double[]{0.50, 0.50, 0.50});
        p.put("aws_api_gateway_rest_api", new double[]{5, 20, 100});
        p.put("aws_cloudfront_distribution", new double[]{10, 30, 100});
        p.put("aws_ecr_repository", new double[]{0, 0, 0});  // Pay per storage
        p.put("aws_nlb", new double[]{18, 22, 28});

        // Azure
        p.put("azurerm_resource_group", new double[]{0, 0, 0});
        p.put("azurerm_virtual_network", new double[]{0, 0, 0});
        p.put("azurerm_subnet", new double[]{0, 0, 0});
        p.put("azurerm_network_interface", new double[]{0, 0, 0});
        p.put("azurerm_public_ip", new double[]{3, 5, 10});
        p.put("azurerm_linux_virtual_machine", new double[]{30, 60, 250});
        p.put("azurerm_windows_virtual_machine", new double[]{40, 80, 300});
        p.put("azurerm_kubernetes_cluster", new double[]{75, 75, 75});
        p.put("azurerm_container_registry", new double[]{5, 15, 50});
        p.put("azurerm_storage_account", new double[]{5, 15, 50});
        p.put("azurerm_sql_database", new double[]{15, 50, 200});
        p.put("azurerm_redis_cache", new double[]{15, 40, 150});
        p.put("azurerm_application_gateway", new double[]{30, 60, 200});
        p.put("azurerm_cosmosdb_account", new double[]{25, 100, 400});
        p.put("azurerm_key_vault", new double[]{0, 1, 5});
        p.put("azurerm_service_bus_namespace", new double[]{5, 15, 50});
        p.put("azurerm_function_app", new double[]{0, 5, 20});
        p.put("azurerm_app_service", new double[]{20, 50, 200});

        // GCP
        p.put("google_compute_network", new double[]{0, 0, 0});
        p.put("google_compute_subnetwork", new double[]{0, 0, 0});
        p.put("google_compute_instance", new double[]{25, 50, 200});
        p.put("google_container_cluster", new double[]{73, 73, 73});
        p.put("google_storage_bucket", new double[]{5, 15, 50});
        p.put("google_sql_database_instance", new double[]{15, 50, 200});
        p.put("google_redis_instance", new double[]{15, 40, 150});
        p.put("google_cloud_run_service", new double[]{0, 5, 50});
        p.put("google_functions_function", new double[]{0, 3, 15});
        p.put("google_bigquery_dataset", new double[]{0, 5, 50});
        p.put("google_bigquery_table", new double[]{0, 0, 0});
        p.put("google_pubsub_topic", new double[]{0, 1, 5});
        p.put("google_pubsub_subscription", new double[]{0, 1, 5});
        p.put("google_compute_firewall", new double[]{0, 0, 0});
        p.put("google_compute_address", new double[]{3, 5, 10});
        p.put("google_artifact_registry_repository", new double[]{0, 0, 0});

        // K8s (control plane managed — worker node costs covered elsewhere)
        p.put("kubernetes_namespace", new double[]{0, 0, 0});
        p.put("kubernetes_deployment", new double[]{0, 0, 0});
        p.put("kubernetes_service", new double[]{0, 0, 0});
        p.put("kubernetes_secret", new double[]{0, 0, 0});
        p.put("kubernetes_config_map", new double[]{0, 0, 0});
        p.put("kubernetes_persistent_volume_claim", new double[]{10, 20, 50});
        p.put("kubernetes_ingress", new double[]{0, 0, 0});
        p.put("kubernetes_horizontal_pod_autoscaler", new double[]{0, 0, 0});
        p.put("kubernetes_stateful_set", new double[]{0, 0, 0});
        p.put("kubernetes_daemon_set", new double[]{0, 0, 0});

        return Collections.unmodifiableMap(p);
    }

    private static class CostCategory {
        final String name;
        int count;
        double minTotal;
        double avgTotal;
        double maxTotal;

        CostCategory(String name, int count, double minTotal, double avgTotal, double maxTotal) {
            this.name = name;
            this.count = count;
            this.minTotal = minTotal;
            this.avgTotal = avgTotal;
            this.maxTotal = maxTotal;
        }
    }
}
