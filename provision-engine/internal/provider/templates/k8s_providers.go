package templates

// k8sTemplates returns the Kubernetes resource template map.
func k8sTemplates() map[string]ResourceTemplate {
	return map[string]ResourceTemplate{
		"kubernetes_namespace":  k8sNamespaceTemplate,
		"kubernetes_deployment": k8sDeploymentTemplate,
		"kubernetes_service":    k8sServiceTemplate,
		"kubernetes_config_map": k8sConfigMapTemplate,
		"namespace":             k8sNamespaceTemplate,
		"deployment":            k8sDeploymentTemplate,
		"service":               k8sServiceTemplate,
		"config_map":            k8sConfigMapTemplate,
		"configmap":             k8sConfigMapTemplate,
	}
}
