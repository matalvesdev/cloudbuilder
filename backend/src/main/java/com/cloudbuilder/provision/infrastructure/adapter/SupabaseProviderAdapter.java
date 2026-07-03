package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class SupabaseProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "supabase_project", "supabase-project", "supabase_table", "supabase-table",
        "supabase_auth", "supabase-auth", "supabase_storage_bucket", "supabase-storage",
        "supabase_edge_function", "supabase-edge", "supabase_realtime", "supabase-realtime"
    );
    @Override public String getProviderType() { return "supabase"; }
    @Override public String getDisplayName() { return "Supabase"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "supabase/supabase"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.1.0"; }
}
