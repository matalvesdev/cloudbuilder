package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class MongoDBAtlasProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "mongodb_project", "mongo-project", "mongodb_cluster", "mongo-cluster",
        "mongodb_database", "mongo-db", "mongodb_user", "mongo-user",
        "mongodb_network_container", "mongo-network", "mongodb_ip_access_list", "mongo-ip"
    );
    @Override public String getProviderType() { return "mongodb-atlas"; }
    @Override public String getDisplayName() { return "MongoDB Atlas"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "mongodb/mongodbatlas"; }
    @Override public String getTerraformVersionConstraint() { return ">= 1.0"; }
}
