package com.cloudbuilder.integration.domain.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ProviderRegistry: Central registry of all available integration providers.
 * Maps provider IDs to their metadata and capabilities.
 */
@Service
public class ProviderRegistry {

    public record ProviderInfo(
        String id,
        String name,
        String category,
        String description,
        List<String> authMethods,
        Map<String, String> capabilities
    ) {}

    private static final Map<String, ProviderInfo> PROVIDERS = Map.ofEntries(
        // Source Control
        Map.entry("github", new ProviderInfo("github", "GitHub", "source-control", "Repositórios e CI/CD", List.of("oauth", "pat", "ssh"), Map.of("repos", "true", "actions", "true", "webhooks", "true"))),
        Map.entry("gitlab", new ProviderInfo("gitlab", "GitLab", "source-control", "Repositórios e CI/CD", List.of("oauth", "pat", "ssh"), Map.of("repos", "true", "ci", "true", "webhooks", "true"))),
        Map.entry("bitbucket", new ProviderInfo("bitbucket", "Bitbucket", "source-control", "Repositórios e CI/CD", List.of("oauth", "app-password"), Map.of("repos", "true", "pipelines", "true"))),
        Map.entry("azure-devops", new ProviderInfo("azure-devops", "Azure DevOps", "source-control", "Repositórios e CI/CD", List.of("pat", "oauth"), Map.of("repos", "true", "pipelines", "true"))),

        // Cloud Providers
        Map.entry("aws", new ProviderInfo("aws", "Amazon Web Services", "cloud", "Provedor de nuvem", List.of("access-key", "iam-role", "oidc"), Map.of("compute", "true", "storage", "true", "database", "true", "kubernetes", "true"))),
        Map.entry("azure", new ProviderInfo("azure", "Microsoft Azure", "cloud", "Provedor de nuvem", List.of("service-principal", "managed-identity"), Map.of("compute", "true", "storage", "true", "database", "true", "kubernetes", "true"))),
        Map.entry("gcp", new ProviderInfo("gcp", "Google Cloud Platform", "cloud", "Provedor de nuvem", List.of("service-account", "workload-identity"), Map.of("compute", "true", "storage", "true", "database", "true", "kubernetes", "true"))),

        // Kubernetes
        Map.entry("eks", new ProviderInfo("eks", "Amazon EKS", "kubernetes", "Kubernetes gerenciado AWS", List.of("kubeconfig"), Map.of("deploy", "true", "monitor", "true"))),
        Map.entry("aks", new ProviderInfo("aks", "Azure AKS", "kubernetes", "Kubernetes gerenciado Azure", List.of("kubeconfig"), Map.of("deploy", "true", "monitor", "true"))),
        Map.entry("gke", new ProviderInfo("gke", "Google GKE", "kubernetes", "Kubernetes gerenciado GCP", List.of("kubeconfig"), Map.of("deploy", "true", "monitor", "true"))),

        // CI/CD
        Map.entry("github-actions", new ProviderInfo("github-actions", "GitHub Actions", "cicd", "CI/CD GitHub", List.of("token"), Map.of("workflows", "true", "artifacts", "true"))),
        Map.entry("gitlab-ci", new ProviderInfo("gitlab-ci", "GitLab CI", "cicd", "CI/CD GitLab", List.of("token"), Map.of("pipelines", "true", "artifacts", "true"))),

        // Databases
        Map.entry("supabase", new ProviderInfo("supabase", "Supabase", "databases", "Banco de dados e auth", List.of("api-key"), Map.of("database", "true", "auth", "true", "storage", "true"))),
        Map.entry("neon", new ProviderInfo("neon", "Neon", "databases", "PostgreSQL serverless", List.of("api-key"), Map.of("database", "true"))),

        // Notifications
        Map.entry("slack", new ProviderInfo("slack", "Slack", "notifications", "Notificações time", List.of("webhook", "oauth"), Map.of("messages", "true", "channels", "true"))),
        Map.entry("teams", new ProviderInfo("teams", "Microsoft Teams", "notifications", "Notificações time", List.of("webhook"), Map.of("messages", "true"))),

        // Identity
        Map.entry("auth0", new ProviderInfo("auth0", "Auth0", "identity", "Autenticação SSO", List.of("oauth", "oidc"), Map.of("sso", "true", "mfa", "true"))),
        Map.entry("keycloak", new ProviderInfo("keycloak", "Keycloak", "identity", "IAM open-source", List.of("oidc", "saml"), Map.of("sso", "true", "ldap", "true"))),
        Map.entry("okta", new ProviderInfo("okta", "Okta", "identity", "IAM enterprise", List.of("oauth", "oidc", "saml"), Map.of("sso", "true", "mfa", "true", "lifecycle", "true")))
    );

    @org.springframework.stereotype.Component
    public static ProviderInfo getProvider(String id) {
        return PROVIDERS.get(id);
    }

    public List<ProviderInfo> listProviders() {
        return List.copyOf(PROVIDERS.values());
    }

    public List<ProviderInfo> listByCategory(String category) {
        return PROVIDERS.values().stream()
                .filter(p -> p.category().equals(category))
                .toList();
    }

    public Optional<ProviderInfo> getProviderInfo(String id) {
        return Optional.ofNullable(PROVIDERS.get(id));
    }

    public boolean isProviderSupported(String id) {
        return PROVIDERS.containsKey(id);
    }
}
