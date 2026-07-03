package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class DigitalOceanProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "digitalocean_droplet", "do-droplet", "digitalocean_kubernetes", "do-k8s",
        "digitalocean_database", "do-db", "digitalocean_spaces", "do-spaces",
        "digitalocean_loadbalancer", "do-lb", "digitalocean_firewall", "do-firewall"
    );
    @Override public String getProviderType() { return "digitalocean"; }
    @Override public String getDisplayName() { return "DigitalOcean"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "digitalocean/digitalocean"; }
    @Override public String getTerraformVersionConstraint() { return ">= 2.0"; }
}
