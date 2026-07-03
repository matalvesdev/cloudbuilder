package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class PlanetScaleProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "planetscale_organization", "ps-org", "planetscale_database", "ps-db",
        "planetscale_branch", "ps-branch", "planetscale_password", "ps-password",
        "planetscale_deploy_request", "ps-deploy"
    );
    @Override public String getProviderType() { return "planetscale"; }
    @Override public String getDisplayName() { return "PlanetScale"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "planetscale/planetscale"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.1"; }
}
