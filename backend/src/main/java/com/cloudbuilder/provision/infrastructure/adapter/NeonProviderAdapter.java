package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class NeonProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "neon_project", "neon-project", "neon_branch", "neon-branch",
        "neon_database", "neon-database", "neon_role", "neon-role",
        "neon_endpoint", "neon-endpoint"
    );
    @Override public String getProviderType() { return "neon"; }
    @Override public String getDisplayName() { return "Neon"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "neondatabase/neon"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.1"; }
}
