package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class VercelProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "vercel_project", "vercel-project", "vercel_deployment", "vercel-deploy",
        "vercel_domain", "vercel-domain", "vercel_env_variable", "vercel-env",
        "vercel_edge_function", "vercel-edge", "vercel_analytics", "vercel-analytics"
    );
    @Override public String getProviderType() { return "vercel"; }
    @Override public String getDisplayName() { return "Vercel"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "vercel/vercel"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.15"; }
}
