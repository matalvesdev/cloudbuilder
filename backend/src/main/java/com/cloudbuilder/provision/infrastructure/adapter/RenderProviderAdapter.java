package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class RenderProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "render_service", "render-service", "render_database", "render-db",
        "render_env_group", "render-envgroup", "render_cron_job", "render-cron",
        "render_static_site", "render-static", "render_redis", "render-redis"
    );
    @Override public String getProviderType() { return "render"; }
    @Override public String getDisplayName() { return "Render"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "render/render"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.2"; }
}
