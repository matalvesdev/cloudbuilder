package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class BitbucketProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "bitbucket_repository", "bitbucket-repo", "bitbucket_pipeline", "bitbucket-pipeline",
        "bitbucket_variable", "bitbucket-variable", "bitbucket_deploy_key", "bitbucket-deploykey",
        "bitbucket_hook", "bitbucket-hook", "bitbucket_workspace", "bitbucket-workspace"
    );
    @Override public String getProviderType() { return "bitbucket"; }
    @Override public String getDisplayName() { return "Bitbucket"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "hashicorp/bitbucket"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.1.0"; }
}
