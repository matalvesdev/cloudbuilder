package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class RailwayProviderAdapter implements ProviderAdapter {

    private static final Map<String, String> COMPONENT_IDS = Map.of(
        "railway_project", "railway-project",
        "railway_service", "railway-service",
        "railway_database", "railway-db",
        "railway_variable", "railway-variable",
        "railway_domain", "railway-domain",
        "railway_deployment", "railway-deploy"
    );

    @Override
    public String getProviderType() { return "railway"; }

    @Override
    public String getDisplayName() { return "Railway"; }

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
        return Map.of();
    }

    @Override
    public boolean supports(String resourceType) {
        return COMPONENT_IDS.containsKey(resourceType);
    }

    @Override
    public String getTerraformProviderSource() { return "railwayapp/railway"; }

    @Override
    public String getTerraformVersionConstraint() { return ">= 0.5.0"; }
}
