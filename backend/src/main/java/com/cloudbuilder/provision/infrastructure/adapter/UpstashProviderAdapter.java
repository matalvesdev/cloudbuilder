package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class UpstashProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "upstash_redis_cluster", "upstash-redis", "upstash_kafka_cluster", "upstash-kafka",
        "upstash_qstash", "upstash-qstash", "upstash_vector", "upstash-vector"
    );
    @Override public String getProviderType() { return "upstash"; }
    @Override public String getDisplayName() { return "Upstash"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "Upstash/upstash"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.5"; }
}
