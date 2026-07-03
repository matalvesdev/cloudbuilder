package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class AzureProviderAdapter implements ProviderAdapter {

    private static final Map<String, String> COMPONENT_IDS = Map.ofEntries(
        Map.entry("azurerm_resource_group", "azure-rg"),
        Map.entry("azurerm_virtual_network", "azure-vnet"),
        Map.entry("azurerm_subnet", "azure-subnet"),
        Map.entry("azurerm_kubernetes_cluster", "azure-aks"),
        Map.entry("azurerm_storage_account", "azure-storage"),
        Map.entry("azurerm_sql_database", "azure-sql"),
        Map.entry("azurerm_key_vault", "azure-keyvault"),
        Map.entry("azurerm_linux_virtual_machine", "azure-vm"),
        Map.entry("azurerm_public_ip", "azure-pip"),
        Map.entry("azurerm_monitor_action_group", "azure-monitor"),
        Map.entry("azurerm_monitor_metric_alert", "azure-alert"),
        Map.entry("azurerm_application_insights", "azure-appinsights"),
        Map.entry("azurerm_cosmosdb_account", "azure-cosmosdb"),
        Map.entry("azurerm_redis_cache", "azure-redis"),
        Map.entry("azurerm_mysql_flexible_server", "azure-mysql"),
        Map.entry("azurerm_postgresql_flexible_server", "azure-postgres")
    );

    private static final Map<String, Map<String, String>> PROPERTY_SCHEMAS = Map.of(
        "azurerm_virtual_network", Map.of("name", "Name", "address_space", "Address Space", "resource_group_name", "Resource Group"),
        "azurerm_kubernetes_cluster", Map.of("name", "Name", "dns_prefix", "DNS Prefix", "kubernetes_version", "K8s Version"),
        "azurerm_storage_account", Map.of("name", "Name", "account_tier", "Tier", "account_replication_type", "Replication"),
        "azurerm_linux_virtual_machine", Map.of("name", "Name", "size", "Size", "admin_username", "Admin User")
    );

    @Override
    public String getProviderType() { return "azure"; }

    @Override
    public String getDisplayName() { return "Microsoft Azure"; }

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
    public String getTerraformProviderSource() { return "hashicorp/azurerm"; }

    @Override
    public String getTerraformVersionConstraint() { return ">= 3.0"; }
}
