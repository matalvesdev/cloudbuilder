package templates

import (
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

// ─── K8s Namespace ─────────────────────────────────────────────────────────

func k8sNamespaceTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)

	return fmt.Sprintf(`resource "kubernetes_namespace" "%s" {
  metadata {
    name = "%s"

    labels = {
      Name        = "%s"
      Environment = "${var.environment}"
      ManagedBy   = "CloudBuilder"
    }
  }
}`, node.ID, name, name), nil
}

// ─── K8s Deployment ────────────────────────────────────────────────────────

func k8sDeploymentTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	replicas := getIntProp(node.Properties, "replicas", 1)
	image := getStringProp(node.Properties, "image", "nginx:latest")
	containerPort := getIntProp(node.Properties, "container_port", 80)
	cpuReq := getStringProp(node.Properties, "cpu_request", "250m")
	cpuLim := getStringProp(node.Properties, "cpu_limit", "500m")
	memReq := getStringProp(node.Properties, "memory_request", "256Mi")
	memLim := getStringProp(node.Properties, "memory_limit", "512Mi")

	return fmt.Sprintf(`resource "kubernetes_deployment" "%s" {
  metadata {
    name      = "%s"
    namespace = kubernetes_namespace.%s.metadata[0].name

    labels = {
      Name        = "%s"
      Environment = "${var.environment}"
      ManagedBy   = "CloudBuilder"
    }
  }

  spec {
    replicas = %d

    selector {
      match_labels = {
        app = "%s"
      }
    }

    template {
      metadata {
        labels = {
          app = "%s"
        }
      }

      spec {
        container {
          image = "%s"
          name  = "%s"

          port {
            container_port = %d
          }

          resources {
            limits = {
              cpu    = "%s"
              memory = "%s"
            }
            requests = {
              cpu    = "%s"
              memory = "%s"
            }
          }
        }
      }
    }
  }
}`, node.ID, name, getParentK8sNamespace(node), name,
		replicas, name, name, image, name, containerPort,
		cpuLim, memLim, cpuReq, memReq), nil
}

// ─── K8s Service ───────────────────────────────────────────────────────────

func k8sServiceTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	serviceType := getStringProp(node.Properties, "type", "ClusterIP")
	port := getIntProp(node.Properties, "port", 80)
	targetPort := getIntProp(node.Properties, "target_port", port)

	return fmt.Sprintf(`resource "kubernetes_service" "%s" {
  metadata {
    name      = "%s"
    namespace = kubernetes_namespace.%s.metadata[0].name

    labels = {
      Name        = "%s"
      Environment = "${var.environment}"
      ManagedBy   = "CloudBuilder"
    }
  }

  spec {
    type = "%s"

    port {
      port        = %d
      target_port = %d
      protocol    = "TCP"
    }

    selector = {
      app = "%s"
    }
  }
}`, node.ID, name, getParentK8sNamespace(node), name,
		serviceType, port, targetPort, name), nil
}

// ─── K8s Ingress ───────────────────────────────────────────────────────────

func k8sIngressTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	hostname := getStringProp(node.Properties, "hostname", "example.com")
	tlsEnabled := getBoolProp(node.Properties, "tls_enabled", false)
	ingressClass := getStringProp(node.Properties, "ingress_class_name", "nginx")

	tlsBlock := ""
	if tlsEnabled {
		tlsBlock = fmt.Sprintf(`
  spec {
    tls {
      hosts       = ["%s"]
      secret_name = "%s-tls"
    }
  }`, hostname, name)
	}

	return fmt.Sprintf(`resource "kubernetes_ingress_v1" "%s" {
  metadata {
    name      = "%s"
    namespace = kubernetes_namespace.%s.metadata[0].name

    annotations = {
      "kubernetes.io/ingress.class" = "%s"
    }

    labels = {
      Name        = "%s"
      Environment = "${var.environment}"
      ManagedBy   = "CloudBuilder"
    }
  }

  spec {%s
    rule {
      host = "%s"

      http {
        path {
          path      = "/"
          path_type = "Prefix"

          backend {
            service {
              name = kubernetes_service.%s.metadata[0].name
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }
}`, node.ID, name, getParentK8sNamespace(node), ingressClass,
		name, tlsBlock, hostname, name), nil
}

// ─── K8s ConfigMap ─────────────────────────────────────────────────────────

func k8sConfigMapTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)

	return fmt.Sprintf(`resource "kubernetes_config_map" "%s" {
  metadata {
    name      = "%s"
    namespace = kubernetes_namespace.%s.metadata[0].name

    labels = {
      Name        = "%s"
      Environment = "${var.environment}"
      ManagedBy   = "CloudBuilder"
    }
  }

  data = {
    # Add configuration key-value pairs here
    # key = "value"
  }
}`, node.ID, name, getParentK8sNamespace(node), name), nil
}

// ─── K8s Secret ────────────────────────────────────────────────────────────

func k8sSecretTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	secretType := getStringProp(node.Properties, "type", "Opaque")

	return fmt.Sprintf(`resource "kubernetes_secret" "%s" {
  metadata {
    name      = "%s"
    namespace = kubernetes_namespace.%s.metadata[0].name

    labels = {
      Name        = "%s"
      Environment = "${var.environment}"
      ManagedBy   = "CloudBuilder"
    }
  }

  type = "%s"

  data = {
    # Add secret key-value pairs here
    # key = base64encode("value")
  }
}`, node.ID, name, getParentK8sNamespace(node), name, secretType), nil
}

// ─── K8s PersistentVolumeClaim ─────────────────────────────────────────────

func k8sPersistentVolumeClaimTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	storageClass := getStringProp(node.Properties, "storage_class_name", "standard")
	accessModes := getStringProp(node.Properties, "access_modes", "ReadWriteOnce")
	storage := getStringProp(node.Properties, "storage", "10Gi")

	return fmt.Sprintf(`resource "kubernetes_persistent_volume_claim" "%s" {
  metadata {
    name      = "%s"
    namespace = kubernetes_namespace.%s.metadata[0].name

    labels = {
      Name        = "%s"
      Environment = "${var.environment}"
      ManagedBy   = "CloudBuilder"
    }
  }

  spec {
    access_modes       = ["%s"]
    storage_class_name = "%s"

    resources {
      requests = {
        storage = "%s"
      }
    }
  }
}`, node.ID, name, getParentK8sNamespace(node), name,
		accessModes, storageClass, storage), nil
}

// ─── K8s HPA ───────────────────────────────────────────────────────────────

func k8sHorizontalPodAutoscalerTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	minReplicas := getIntProp(node.Properties, "min_replicas", 1)
	maxReplicas := getIntProp(node.Properties, "max_replicas", 10)
	targetCPU := getIntProp(node.Properties, "target_cpu_utilization", 80)

	return fmt.Sprintf(`resource "kubernetes_horizontal_pod_autoscaler_v2" "%s" {
  metadata {
    name      = "%s"
    namespace = kubernetes_namespace.%s.metadata[0].name

    labels = {
      Name        = "%s"
      Environment = "${var.environment}"
      ManagedBy   = "CloudBuilder"
    }
  }

  spec {
    min_replicas = %d
    max_replicas = %d

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = %d
        }
      }
    }

    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.%s.metadata[0].name
    }
  }
}`, node.ID, name, getParentK8sNamespace(node), name,
		minReplicas, maxReplicas, targetCPU, name), nil
}

// ─── Template Registry ─────────────────────────────────────────────────────

func k8sTemplates() map[string]ResourceTemplate {
	return map[string]ResourceTemplate{
		"kubernetes_namespace":                k8sNamespaceTemplate,
		"kubernetes_deployment":               k8sDeploymentTemplate,
		"kubernetes_service":                  k8sServiceTemplate,
		"kubernetes_ingress":                  k8sIngressTemplate,
		"kubernetes_ingress_v1":               k8sIngressTemplate,
		"kubernetes_config_map":               k8sConfigMapTemplate,
		"kubernetes_secret":                   k8sSecretTemplate,
		"kubernetes_persistent_volume_claim":  k8sPersistentVolumeClaimTemplate,
		"kubernetes_horizontal_pod_autoscaler": k8sHorizontalPodAutoscalerTemplate,
		"kubernetes_hpa":                      k8sHorizontalPodAutoscalerTemplate,
		// Aliases
		"namespace":    k8sNamespaceTemplate,
		"deploy":       k8sDeploymentTemplate,
		"deployment":   k8sDeploymentTemplate,
		"service":      k8sServiceTemplate,
		"ingress":      k8sIngressTemplate,
		"configmap":    k8sConfigMapTemplate,
		"config_map":   k8sConfigMapTemplate,
		"secret":       k8sSecretTemplate,
		"pvc":          k8sPersistentVolumeClaimTemplate,
		"hpa":          k8sHorizontalPodAutoscalerTemplate,
	}
}

// ─── Helpers ───────────────────────────────────────────────────────────────

func getParentK8sNamespace(node model.DesignNode) string {
	if v, ok := node.Properties["namespace"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	if v, ok := node.Properties["namespaceId"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "default"
}
