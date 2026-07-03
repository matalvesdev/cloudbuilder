package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class CloudflareProviderAdapter implements ProviderAdapter {

    private static final Map<String, String> COMPONENT_IDS = Map.of(
        "cloudflare_zone", "cf-zone",
        "cloudflare_dns_record", "cf-dns",
        "cloudflare_worker", "cf-worker",
        "cloudflare_pages_project", "cf-pages",
        "cloudflare_r2_bucket", "cf-r2",
        "cloudflare_workers_kv_namespace", "cf-kv",
        "cloudflare_firewall_rule", "cf-firewall"
    );

    @Override
    public String getProviderType() { return "cloudflare"; }

    @Override
    public String getDisplayName() { return "Cloudflare"; }

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
    public String getTerraformProviderSource() { return "cloudflare/cloudflare"; }

    @Override
    public String getTerraformVersionConstraint() { return ">= 4.0"; }
}
