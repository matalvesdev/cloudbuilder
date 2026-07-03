package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class KubernetesProviderAdapter implements ProviderAdapter {

    private static final Map<String, String> COMPONENT_IDS = Map.of(
        "kubernetes_namespace", "k8s-namespace",
        "kubernetes_deployment", "k8s-deploy",
        "kubernetes_service", "k8s-service",
        "kubernetes_config_map", "k8s-configmap",
        "kubernetes_secret", "k8s-secret",
        "kubernetes_ingress", "k8s-ingress",
        "kubernetes_stateful_set", "k8s-statefulset",
        "kubernetes_daemon_set", "k8s-daemonset",
        "kubernetes_hpa", "k8s-hpa",
        "kubernetes_network_policy", "k8s-netpol"
    );

    private static final Map<String, Map<String, String>> PROPERTY_SCHEMAS = Map.of(
        "kubernetes_namespace", Map.of("metadata.name", "Name"),
        "kubernetes_deployment", Map.of("metadata.name", "Name", "spec.replicas", "Replicas", "spec.template.spec.containers.image", "Image"),
        "kubernetes_service", Map.of("metadata.name", "Name", "spec.type", "Type", "spec.port", "Port"),
        "kubernetes_config_map", Map.of("metadata.name", "Name", "data", "Data")
    );

    @Override
    public String getProviderType() { return "k8s"; }

    @Override
    public String getDisplayName() { return "Kubernetes"; }

    @Override
    public List<String> getSupportedResourceTypes() {
        return List.copyOf(COMPONENT_IDS.keySet());
    }

    @Override
    public String mapToComponentId(String terraformResourceType) {
        return COMPONENT_IDS.getOrDefault(terraformResourceType, terraformResourceType);
    }

    @Override
    public Map<String, String> getPropertySchema(String resourceType) {
        return PROPERTY_SCHEMAS.getOrDefault(resourceType, Map.of());
    }

    @Override
    public boolean supports(String resourceType) {
        return COMPONENT_IDS.containsKey(resourceType);
    }

    @Override
    public String getTerraformProviderSource() { return "hashicorp/kubernetes"; }

    @Override
    public String getTerraformVersionConstraint() { return ">= 2.0"; }
}
