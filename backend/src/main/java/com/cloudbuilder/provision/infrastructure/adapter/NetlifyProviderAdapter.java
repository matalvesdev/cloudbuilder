package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class NetlifyProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "netlify_site", "netlify-site", "netlify_dns_zone", "netlify-dns",
        "netlify_function", "netlify-function", "netlify_env_vars", "netlify-env",
        "netlify_form", "netlify-form", "netlify_deploy_hook", "netlify-deploy"
    );
    @Override public String getProviderType() { return "netlify"; }
    @Override public String getDisplayName() { return "Netlify"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "netlify/netlify"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.3"; }
}
