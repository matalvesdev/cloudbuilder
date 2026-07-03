package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class GitLabProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "gitlab_project", "gitlab-project", "gitlab_pipeline", "gitlab-pipeline",
        "gitlab_variable", "gitlab-variable", "gitlab_runner", "gitlab-runner",
        "gitlab_trigger", "gitlab-trigger", "gitlab_deploy_key", "gitlab-deploykey"
    );
    @Override public String getProviderType() { return "gitlab"; }
    @Override public String getDisplayName() { return "GitLab"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "gitlabhq/gitlab"; }
    @Override public String getTerraformVersionConstraint() { return ">= 16.0"; }
}
