package templates

import (
	"testing"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

func TestK8sGetTemplate_ExistingTypes(t *testing.T) {
	resourceTypes := []string{
		"kubernetes_namespace",
		"kubernetes_deployment",
		"kubernetes_service",
		"kubernetes_config_map",
		"namespace",
		"deployment",
		"service",
		"config_map",
		"configmap",
	}

	for _, rt := range resourceTypes {
		t.Run(rt, func(t *testing.T) {
			_, ok := GetTemplate(model.ProviderK8s, rt)
			if !ok {
				t.Errorf("GetTemplate(k8s, %q) = false, want true", rt)
			}
		})
	}
}

func TestK8sGetTemplate_UnknownType(t *testing.T) {
	_, ok := GetTemplate(model.ProviderK8s, "nonexistent")
	if ok {
		t.Error("GetTemplate(k8s, nonexistent) = true, want false")
	}
}

func TestK8sGetTemplate_CrossProviderRejection(t *testing.T) {
	_, ok := GetTemplate(model.ProviderK8s, "aws_instance")
	if ok {
		t.Error("GetTemplate(k8s, aws_instance) = true, want false")
	}
}

func TestK8sNamespaceTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "ns1",
		Name: "Production",
		Properties: map[string]interface{}{
			"name": "prod",
		},
	}

	result, err := k8sNamespaceTemplate(node)
	if err != nil {
		t.Fatalf("k8sNamespaceTemplate() error = %v", err)
	}

	if !contains(result, "kubernetes_namespace") {
		t.Error("expected kubernetes_namespace resource")
	}
	if !contains(result, "ns1") {
		t.Error("expected node ID in resource name")
	}
	if !contains(result, "prod") {
		t.Error("expected namespace name")
	}
}

func TestK8sNamespaceTemplate_DefaultName(t *testing.T) {
	node := model.DesignNode{
		ID:         "ns2",
		Name:       "Default NS",
		Properties: map[string]interface{}{},
	}

	result, err := k8sNamespaceTemplate(node)
	if err != nil {
		t.Fatalf("k8sNamespaceTemplate() error = %v", err)
	}

	if !contains(result, "Default NS") {
		t.Error("expected node Name as default namespace name")
	}
}

func TestK8sDeploymentTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "dep1",
		Name: "API Server",
		Properties: map[string]interface{}{
			"name":          "api-server",
			"replicas":      "3",
			"image":         "myapp/api:v2",
			"container_port": 8080,
		},
	}

	result, err := k8sDeploymentTemplate(node)
	if err != nil {
		t.Fatalf("k8sDeploymentTemplate() error = %v", err)
	}

	if !contains(result, "kubernetes_deployment") {
		t.Error("expected kubernetes_deployment resource")
	}
	if !contains(result, "api-server") {
		t.Error("expected deployment name")
	}
	if !contains(result, `replicas = 3`) {
		t.Error("expected 3 replicas")
	}
	if !contains(result, "myapp/api:v2") {
		t.Error("expected container image")
	}
	if !contains(result, "container_port = 8080") {
		t.Error("expected container port")
	}
	if !contains(result, "kubernetes_namespace.default.metadata") {
		t.Error("expected default namespace reference")
	}
}

func TestK8sDeploymentTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "dep2",
		Name:       "Web",
		Properties: map[string]interface{}{},
	}

	result, err := k8sDeploymentTemplate(node)
	if err != nil {
		t.Fatalf("k8sDeploymentTemplate() error = %v", err)
	}

	if !contains(result, `replicas = 1`) {
		t.Error("expected default 1 replica")
	}
	if !contains(result, "nginx:latest") {
		t.Error("expected default nginx image")
	}
	if !contains(result, "container_port = 80") {
		t.Error("expected default port 80")
	}
}

func TestK8sDeploymentTemplate_CustomNamespace(t *testing.T) {
	node := model.DesignNode{
		ID:   "dep3",
		Name: "App",
		Properties: map[string]interface{}{
			"namespaceId": "my-ns",
		},
	}

	result, err := k8sDeploymentTemplate(node)
	if err != nil {
		t.Fatalf("k8sDeploymentTemplate() error = %v", err)
	}

	if !contains(result, "kubernetes_namespace.my-ns.metadata") {
		t.Error("expected custom namespace reference")
	}
}

func TestK8sServiceTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "svc1",
		Name: "API Service",
		Properties: map[string]interface{}{
			"name":        "api-svc",
			"type":        "LoadBalancer",
			"port":        443,
			"target_port": 8443,
		},
	}

	result, err := k8sServiceTemplate(node)
	if err != nil {
		t.Fatalf("k8sServiceTemplate() error = %v", err)
	}

	if !contains(result, "kubernetes_service") {
		t.Error("expected kubernetes_service resource")
	}
	if !contains(result, "LoadBalancer") {
		t.Error("expected LoadBalancer type")
	}
	if !contains(result, "443") {
		t.Error("expected port 443")
	}
	if !contains(result, "8443") {
		t.Error("expected target port 8443")
	}
}

func TestK8sServiceTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "svc2",
		Name:       "Internal",
		Properties: map[string]interface{}{},
	}

	result, err := k8sServiceTemplate(node)
	if err != nil {
		t.Fatalf("k8sServiceTemplate() error = %v", err)
	}

	if !contains(result, "ClusterIP") {
		t.Error("expected default ClusterIP type")
	}
	if !contains(result, `port = 80`) {
		t.Error("expected default port 80")
	}
	if !contains(result, "kubernetes_namespace.default.metadata") {
		t.Error("expected default namespace reference")
	}
}

func TestK8sConfigMapTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "cm1",
		Name: "App Config",
		Properties: map[string]interface{}{
			"name": "app-config",
		},
	}

	result, err := k8sConfigMapTemplate(node)
	if err != nil {
		t.Fatalf("k8sConfigMapTemplate() error = %v", err)
	}

	if !contains(result, "kubernetes_config_map") {
		t.Error("expected kubernetes_config_map resource")
	}
	if !contains(result, "app-config") {
		t.Error("expected config map name")
	}
	if !contains(result, "kubernetes_namespace.default.metadata") {
		t.Error("expected default namespace reference")
	}
}

func TestK8sGetNamespace_Exists(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{"namespaceId": "custom-ns"}}
	result := getParentK8sNamespace(node)
	if result != "custom-ns" {
		t.Errorf("getParentK8sNamespace() = %q, want %q", result, "custom-ns")
	}
}

func TestK8sGetNamespace_Default(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{}}
	result := getParentK8sNamespace(node)
	if result != "default" {
		t.Errorf("getParentK8sNamespace() = %q, want %q", result, "default")
	}
}

func TestK8sGetNamespace_NilProps(t *testing.T) {
	node := model.DesignNode{}
	result := getParentK8sNamespace(node)
	if result != "default" {
		t.Errorf("getParentK8sNamespace() = %q, want %q", result, "default")
	}
}
