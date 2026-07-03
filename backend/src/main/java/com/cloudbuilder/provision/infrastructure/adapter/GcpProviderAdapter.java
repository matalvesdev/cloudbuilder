package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class GcpProviderAdapter implements ProviderAdapter {

    private static final Map<String, String> COMPONENT_IDS = Map.ofEntries(
        Map.entry("google_compute_network", "gcp-vpc"),
        Map.entry("google_compute_subnetwork", "gcp-subnet"),
        Map.entry("google_compute_instance", "gcp-vm"),
        Map.entry("google_container_cluster", "gcp-gke"),
        Map.entry("google_storage_bucket", "gcp-gcs"),
        Map.entry("google_cloud_run_service", "gcp-cloudrun"),
        Map.entry("google_sql_database_instance", "gcp-cloudsql"),
        Map.entry("google_secret_manager_secret", "gcp-secrets"),
        Map.entry("google_cloudfunctions_function", "gcp-functions"),
        Map.entry("google_redis_instance", "gcp-memorystore"),
        Map.entry("google_pubsub_topic", "gcp-pubsub"),
        Map.entry("google_logging_metric", "gcp-logging"),
        Map.entry("google_monitoring_alert_policy", "gcp-monitoring"),
        Map.entry("google_bigquery_dataset", "gcp-bigquery"),
        Map.entry("google_cloud_run_v2_service", "gcp-cloudrun-v2")
    );

    private static final Map<String, Map<String, String>> PROPERTY_SCHEMAS = Map.of(
        "google_compute_network", Map.of("name", "Name", "auto_create_subnetworks", "Auto Subnets"),
        "google_compute_instance", Map.of("name", "Name", "machine_type", "Machine Type", "zone", "Zone"),
        "google_container_cluster", Map.of("name", "Name", "location", "Location", "min_node_count", "Min Nodes"),
        "google_storage_bucket", Map.of("name", "Name", "location", "Location", "storage_class", "Storage Class")
    );

    @Override
    public String getProviderType() { return "gcp"; }

    @Override
    public String getDisplayName() { return "Google Cloud Platform"; }

    @Override
    public List<String> getSupportedResourceTypes() {
        return List.copyOf(COMPONENT_IDS.keySet());
    }

    @Override
    public String mapToComponentId(String terraformResourceType) {
        return COMPONENT_IDS.getOrDefault(terraformResourceType, terraformResourceType);
    }

    @Override
    public Map<String, String> getPropertySchema(String resourceType) {
        return PROPERTY_SCHEMAS.getOrDefault(resourceType, Map.of());
    }

    @Override
    public boolean supports(String resourceType) {
        return COMPONENT_IDS.containsKey(resourceType);
    }

    @Override
    public String getTerraformProviderSource() { return "hashicorp/google"; }

    @Override
    public String getTerraformVersionConstraint() { return ">= 5.0"; }
}
