package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class FlyIOProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "flyio_app", "fly-app", "flyio_machine", "fly-machine",
        "flyio_volume", "fly-volume", "flyio_certificate", "fly-cert",
        "flyio_postgres", "fly-postgres", "flyio_redis", "fly-redis"
    );
    @Override public String getProviderType() { return "flyio"; }
    @Override public String getDisplayName() { return "Fly.io"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "fly-apps/fly"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.0.1"; }
}
