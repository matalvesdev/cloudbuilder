package templates

import (
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

// gcpComputeNetworkTemplate generates a google_compute_network block.
func gcpComputeNetworkTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	autoCreate := getBoolProp(node.Properties, "autoCreateSubnetworks", false)

	autoStr := "false"
	if autoCreate {
		autoStr = "true"
	}

	return fmt.Sprintf(`resource "google_compute_network" "%s" {
  name                    = "%s"
  project                 = "%s"
  auto_create_subnetworks = %s

  routing_mode = "REGIONAL"
}`, node.ID, name, project, autoStr), nil
}

// gcpSubnetworkTemplate generates a google_compute_subnetwork block.
func gcpSubnetworkTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	region := getStringProp(node.Properties, "region", "us-central1")
	cidr := getStringProp(node.Properties, "cidr", "10.0.1.0/24")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	privateAccess := getBoolProp(node.Properties, "privateGoogleAccess", true)

	privateStr := "false"
	if privateAccess {
		privateStr = "true"
	}

	return fmt.Sprintf(`resource "google_compute_subnetwork" "%s" {
  name                     = "%s"
  project                  = "%s"
  region                   = "%s"
  network                  = google_compute_network.%s.id
  ip_cidr_range            = "%s"
  private_ip_google_access = %s
}`, node.ID, name, project, region, getGCPParentNetworkID(node), cidr, privateStr), nil
}

// gcpComputeInstanceTemplate generates a google_compute_instance block.
func gcpComputeInstanceTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	machineType := getStringProp(node.Properties, "machineType", "e2-micro")
	zone := getStringProp(node.Properties, "zone", "us-central1-a")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	image := getStringProp(node.Properties, "image", "ubuntu-os-cloud/ubuntu-2204-lts")

	return fmt.Sprintf(`resource "google_compute_instance" "%s" {
  name         = "%s"
  project      = "%s"
  machine_type = "%s"
  zone         = "%s"

  boot_disk {
    initialize_params {
      image = "%s"
      size  = 30
      type  = "pd-ssd"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.%s.id
    access_config {
      // Ephemeral public IP
    }
  }

  tags = ["cloudbuilder", "%s"]

  metadata = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, project, machineType, zone, image, getGCPParentSubnetID(node), name, name), nil
}

// gcpStorageBucketTemplate generates a google_storage_bucket block.
func gcpStorageBucketTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "US")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	versioning := getBoolProp(node.Properties, "versioning", true)

	versioningStr := "false"
	if versioning {
		versioningStr = "true"
	}

	return fmt.Sprintf(`resource "google_storage_bucket" "%s" {
  name                        = "%s"
  project                     = "%s"
  location                    = "%s"
  force_destroy               = true
  uniform_bucket_level_access = true

  versioning {
    enabled = %s
  }

  labels = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, project, location, versioningStr, name), nil
}

// --- helpers ---

func getGCPParentNetworkID(node model.DesignNode) string {
	if v, ok := node.Properties["networkId"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "main"
}

func getGCPParentSubnetID(node model.DesignNode) string {
	if v, ok := node.Properties["subnetId"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "main"
}
