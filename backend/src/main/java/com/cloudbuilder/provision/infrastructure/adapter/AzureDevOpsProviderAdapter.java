package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class AzureDevOpsProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "azuredevops_project", "ado-project", "azuredevops_repository", "ado-repo",
        "azuredevops_pipeline", "ado-pipeline", "azuredevops_variable_group", "ado-variable",
        "azuredevops_service_endpoint", "ado-endpoint", "azuredevops_environment", "ado-env"
    );
    @Override public String getProviderType() { return "azuredevops"; }
    @Override public String getDisplayName() { return "Azure DevOps"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "microsoft/azuredevops"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.10"; }
}
