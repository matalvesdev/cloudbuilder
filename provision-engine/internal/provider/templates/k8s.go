package templates

import (
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

// k8sNamespaceTemplate generates a kubernetes_namespace block.
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

// k8sDeploymentTemplate generates a kubernetes_deployment block.
func k8sDeploymentTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	replicas := getStringProp(node.Properties, "replicas", "1")
	image := getStringProp(node.Properties, "image", "nginx:latest")
	containerPort := getStringProp(node.Properties, "containerPort", "80")

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
    replicas = %s

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
            container_port = %s
          }

          resources {
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
            requests = {
              cpu    = "250m"
              memory = "256Mi"
            }
          }
        }
      }
    }
  }
}`, node.ID, name, getK8sNamespace(node), name, replicas, name, name, image, name, containerPort), nil
}

// k8sServiceTemplate generates a kubernetes_service block.
func k8sServiceTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	serviceType := getStringProp(node.Properties, "serviceType", "ClusterIP")
	port := getStringProp(node.Properties, "port", "80")
	targetPort := getStringProp(node.Properties, "targetPort", port)

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
      port        = %s
      target_port = %s
      protocol    = "TCP"
    }

    selector = {
      app = "%s"
    }
  }
}`, node.ID, name, getK8sNamespace(node), name, serviceType, port, targetPort, name), nil
}

// k8sConfigMapTemplate generates a kubernetes_config_map block.
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
}`, node.ID, name, getK8sNamespace(node), name), nil
}

// --- helpers ---

func getK8sNamespace(node model.DesignNode) string {
	if v, ok := node.Properties["namespaceId"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "default"
}
