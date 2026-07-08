package templates

import (
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

// ─── GCP Compute Network ───────────────────────────────────────────────────

func gcpComputeNetworkTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	autoCreate := getBoolProp(node.Properties, "auto_create_subnetworks", false)
	routingMode := getStringProp(node.Properties, "routing_mode", "REGIONAL")
	mtu := getIntProp(node.Properties, "mtu", 1460)

	return fmt.Sprintf(`resource "google_compute_network" "%s" {
  name                    = "%s"
  project                 = "%s"
  auto_create_subnetworks = %v
  routing_mode            = "%s"
  mtu                     = %d
}`, node.ID, name, project, autoCreate, routingMode, mtu), nil
}

// ─── GCP Compute Subnetwork ────────────────────────────────────────────────

func gcpSubnetworkTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	region := getStringProp(node.Properties, "region", "us-central1")
	cidr := getStringProp(node.Properties, "ip_cidr_range", "10.0.1.0/24")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	privateAccess := getBoolProp(node.Properties, "private_ip_google_access", true)

	return fmt.Sprintf(`resource "google_compute_subnetwork" "%s" {
  name                     = "%s"
  project                  = "%s"
  region                   = "%s"
  network                  = google_compute_network.%s.id
  ip_cidr_range            = "%s"
  private_ip_google_access = %v
}`, node.ID, name, project, region, getParentGCPNetwork(node), cidr, privateAccess), nil
}

// ─── GCP Compute Instance ──────────────────────────────────────────────────

func gcpComputeInstanceTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	machineType := getStringProp(node.Properties, "machine_type", "e2-micro")
	zone := getStringProp(node.Properties, "zone", "us-central1-a")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	image := getStringProp(node.Properties, "image", "ubuntu-os-cloud/ubuntu-2204-lts")
	diskSize := getIntProp(node.Properties, "boot_disk_size", 30)
	diskType := getStringProp(node.Properties, "boot_disk_type", "pd-ssd")

	return fmt.Sprintf(`resource "google_compute_instance" "%s" {
  name         = "%s"
  project      = "%s"
  machine_type = "%s"
  zone         = "%s"

  boot_disk {
    initialize_params {
      image = "%s"
      size  = %d
      type  = "%s"
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
}`, node.ID, name, project, machineType, zone,
		image, diskSize, diskType, getParentGCPSubnet(node), name, name), nil
}

// ─── GCP Storage Bucket ────────────────────────────────────────────────────

func gcpStorageBucketTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "US")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	storageClass := getStringProp(node.Properties, "storage_class", "STANDARD")
	versioning := getBoolProp(node.Properties, "versioning", true)
	uniformAccess := getBoolProp(node.Properties, "uniform_bucket_level_access", true)
	forceDestroy := getBoolProp(node.Properties, "force_destroy", true)

	return fmt.Sprintf(`resource "google_storage_bucket" "%s" {
  name                        = "%s"
  project                     = "%s"
  location                    = "%s"
  storage_class               = "%s"
  force_destroy               = %v
  uniform_bucket_level_access = %v

  versioning {
    enabled = %v
  }

  labels = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, project, location, storageClass,
		forceDestroy, uniformAccess, versioning, name), nil
}

// ─── GKE Cluster ───────────────────────────────────────────────────────────

func gcpContainerClusterTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "us-central1")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	nodeCount := getIntProp(node.Properties, "initial_node_count", 1)
	minNodes := getIntProp(node.Properties, "min_node_count", 1)
	maxNodes := getIntProp(node.Properties, "max_node_count", 5)

	return fmt.Sprintf(`resource "google_container_cluster" "%s" {
  name     = "%s"
  project  = "%s"
  location = "%s"

  initial_node_count = %d

  node_config {
    machine_type = "e2-medium"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  autoscaling {
    min_node_count = %d
    max_node_count = %d
  }

  labels = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, project, location, nodeCount, minNodes, maxNodes, name), nil
}

// ─── GCP Cloud SQL ─────────────────────────────────────────────────────────

func gcpSqlDatabaseInstanceTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	dbVersion := getStringProp(node.Properties, "database_version", "POSTGRES_16")
	region := getStringProp(node.Properties, "region", "us-central1")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	tier := getStringProp(node.Properties, "tier", "db-f1-micro")
	diskSize := getIntProp(node.Properties, "disk_size", 10)
	diskType := getStringProp(node.Properties, "disk_type", "PD_SSD")

	return fmt.Sprintf(`resource "google_sql_database_instance" "%s" {
  name             = "%s"
  project          = "%s"
  region           = "%s"
  database_version = "%s"

  settings {
    tier              = "%s"
    disk_size         = %d
    disk_type         = "%s"
    availability_type = "ZONAL"

    backup_configuration {
      enabled = true
    }
  }

  labels = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, project, region, dbVersion,
		tier, diskSize, diskType, name), nil
}

// ─── GCP Cloud Run ─────────────────────────────────────────────────────────

func gcpCloudRunServiceTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "us-central1")
	image := getStringProp(node.Properties, "image", "gcr.io/cloudrun/hello")
	minInstances := getIntProp(node.Properties, "min_instances", 0)
	maxInstances := getIntProp(node.Properties, "max_instances", 10)

	return fmt.Sprintf(`resource "google_cloud_run_service" "%s" {
  name     = "%s"
  location = "%s"

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "%d"
        "autoscaling.knative.dev/maxScale" = "%d"
      }
    }
    spec {
      containers {
        image = "%s"
      }
    }
  }

  labels = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, minInstances, maxInstances, image, name), nil
}

// ─── GCP Cloud Functions ───────────────────────────────────────────────────

func gcpCloudFunctionTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	runtime := getStringProp(node.Properties, "runtime", "nodejs20")
	region := getStringProp(node.Properties, "region", "us-central1")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	entryPoint := getStringProp(node.Properties, "entry_point", "helloWorld")

	return fmt.Sprintf(`resource "google_cloudfunctions_function" "%s" {
  name        = "%s"
  project     = "%s"
  region      = "%s"
  runtime     = "%s"
  entry_point = "%s"
  source_archive_bucket = google_storage_bucket.%s.id
  source_archive_object = "%s-source.zip"

  trigger_http = true

  labels = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, project, region, runtime, entryPoint,
		getParentGCPBucket(node), name, name), nil
}

// ─── GCP Memorystore Redis ─────────────────────────────────────────────────

func gcpRedisInstanceTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	region := getStringProp(node.Properties, "region", "us-central1")
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")
	tier := getStringProp(node.Properties, "tier", "BASIC")
	memoryGB := getIntProp(node.Properties, "memory_size_gb", 1)

	return fmt.Sprintf(`resource "google_redis_instance" "%s" {
  name           = "%s"
  project        = "%s"
  region         = "%s"
  memory_size_gb = %d
  tier           = "%s"

  labels = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, project, region, memoryGB, tier, name), nil
}

// ─── GCP Cloud CDN (Backend Bucket) ────────────────────────────────────────

func gcpBackendBucketTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	project := getStringProp(node.Properties, "project", "${var.gcp_project}")

	return fmt.Sprintf(`resource "google_compute_backend_bucket" "%s" {
  name        = "%s"
  project     = "%s"
  bucket_name = google_storage_bucket.%s.name
  enable_cdn  = true

  labels = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, project, getParentGCPBucket(node), name), nil
}

// ─── Template Registry ─────────────────────────────────────────────────────

func gcpTemplates() map[string]ResourceTemplate {
	return map[string]ResourceTemplate{
		"google_compute_network":       gcpComputeNetworkTemplate,
		"google_compute_subnetwork":    gcpSubnetworkTemplate,
		"google_compute_instance":      gcpComputeInstanceTemplate,
		"google_storage_bucket":        gcpStorageBucketTemplate,
		"google_container_cluster":     gcpContainerClusterTemplate,
		"google_sql_database_instance": gcpSqlDatabaseInstanceTemplate,
		"google_cloud_run_service":     gcpCloudRunServiceTemplate,
		"google_cloudfunctions_function": gcpCloudFunctionTemplate,
		"google_redis_instance":        gcpRedisInstanceTemplate,
		"google_compute_backend_bucket": gcpBackendBucketTemplate,
		// Aliases
		"compute_network":    gcpComputeNetworkTemplate,
		"compute_subnetwork": gcpSubnetworkTemplate,
		"vpc":                gcpComputeNetworkTemplate,
		"network":            gcpComputeNetworkTemplate,
		"subnetwork":         gcpSubnetworkTemplate,
		"subnet":             gcpSubnetworkTemplate,
		"instance":           gcpComputeInstanceTemplate,
		"compute_instance":   gcpComputeInstanceTemplate,
		"gce":                gcpComputeInstanceTemplate,
		"storage_bucket":     gcpStorageBucketTemplate,
		"bucket":             gcpStorageBucketTemplate,
		"gcs":                gcpStorageBucketTemplate,
		"gke":                gcpContainerClusterTemplate,
		"cloudsql":           gcpSqlDatabaseInstanceTemplate,
		"cloud_run":          gcpCloudRunServiceTemplate,
		"cloud_function":     gcpCloudFunctionTemplate,
		"redis":              gcpRedisInstanceTemplate,
		"cdn":                gcpBackendBucketTemplate,
	}
}

// ─── Helpers ───────────────────────────────────────────────────────────────

func getParentGCPNetwork(node model.DesignNode) string {
	if v, ok := node.Properties["network"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	if v, ok := node.Properties["networkId"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "main"
}

func getParentGCPSubnet(node model.DesignNode) string {
	if v, ok := node.Properties["subnetwork"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	if v, ok := node.Properties["subnetId"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "main"
}

func getParentGCPBucket(node model.DesignNode) string {
	if v, ok := node.Properties["bucket"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "main"
}
