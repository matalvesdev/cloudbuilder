package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class GitHubProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "github_repository", "github-repo", "github_actions_workflow", "github-actions",
        "github_pages", "github-pages", "github_webhook", "github-webhook",
        "github_release", "github-release", "github_environment", "github-env"
    );
    @Override public String getProviderType() { return "github"; }
    @Override public String getDisplayName() { return "GitHub"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "integrations/github"; }
    @Override public String getTerraformVersionConstraint() { return ">= 6.0"; }
}
