package templates

import (
	"testing"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

func TestGcpGetTemplate_ExistingTypes(t *testing.T) {
	resourceTypes := []string{
		"google_compute_network",
		"google_compute_subnetwork",
		"google_compute_instance",
		"google_storage_bucket",
		"compute_network",
		"vpc",
		"subnet",
		"instance",
		"gce",
		"bucket",
		"gcs",
	}

	for _, rt := range resourceTypes {
		t.Run(rt, func(t *testing.T) {
			_, ok := GetTemplate(model.ProviderGCP, rt)
			if !ok {
				t.Errorf("GetTemplate(gcp, %q) = false, want true", rt)
			}
		})
	}
}

func TestGcpGetTemplate_UnknownType(t *testing.T) {
	_, ok := GetTemplate(model.ProviderGCP, "nonexistent")
	if ok {
		t.Error("GetTemplate(gcp, nonexistent) = true, want false")
	}
}

func TestGcpGetTemplate_CrossProviderRejection(t *testing.T) {
	_, ok := GetTemplate(model.ProviderGCP, "aws_vpc")
	if ok {
		t.Error("GetTemplate(gcp, aws_vpc) = true, want false")
	}
}

func TestGcpComputeNetworkTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "net1",
		Name: "Main Network",
		Properties: map[string]interface{}{
			"name":                 "main-net",
			"project":              "my-project",
			"auto_create_subnetworks": true,
		},
	}

	result, err := gcpComputeNetworkTemplate(node)
	if err != nil {
		t.Fatalf("gcpComputeNetworkTemplate() error = %v", err)
	}

	if !contains(result, "google_compute_network") {
		t.Error("expected google_compute_network resource")
	}
	if !contains(result, "main-net") {
		t.Error("expected network name")
	}
	if !contains(result, "my-project") {
		t.Error("expected project")
	}
	if !contains(result, "auto_create_subnetworks = true") {
		t.Error("expected auto_create_subnetworks = true")
	}
}

func TestGcpComputeNetworkTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "net2",
		Name:       "Default Net",
		Properties: map[string]interface{}{},
	}

	result, err := gcpComputeNetworkTemplate(node)
	if err != nil {
		t.Fatalf("gcpComputeNetworkTemplate() error = %v", err)
	}

	if !contains(result, "auto_create_subnetworks = false") {
		t.Error("expected auto_create_subnetworks = false (default)")
	}
	if !contains(result, "${var.gcp_project}") {
		t.Error("expected default project variable")
	}
}

func TestGcpSubnetworkTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "sub1",
		Name: "App Subnet",
		Properties: map[string]interface{}{
			"name":                     "app-subnet",
			"region":                   "us-east1",
			"ip_cidr_range":            "10.0.1.0/24",
			"project":                  "app-project",
			"private_ip_google_access": false,
		},
	}

	result, err := gcpSubnetworkTemplate(node)
	if err != nil {
		t.Fatalf("gcpSubnetworkTemplate() error = %v", err)
	}

	if !contains(result, "google_compute_subnetwork") {
		t.Error("expected google_compute_subnetwork resource")
	}
	if !contains(result, "us-east1") {
		t.Error("expected region")
	}
	if !contains(result, "10.0.1.0/24") {
		t.Error("expected CIDR range")
	}
	if !contains(result, "private_ip_google_access = false") {
		t.Error("expected private Google access = false")
	}
	if !contains(result, "google_compute_network.main.id") {
		t.Error("expected default network reference")
	}
}

func TestGcpSubnetworkTemplate_CustomNetwork(t *testing.T) {
	node := model.DesignNode{
		ID:   "sub2",
		Name: "DB Subnet",
		Properties: map[string]interface{}{
			"networkId": "custom-net",
			"cidr":      "10.0.2.0/24",
		},
	}

	result, err := gcpSubnetworkTemplate(node)
	if err != nil {
		t.Fatalf("gcpSubnetworkTemplate() error = %v", err)
	}

	if !contains(result, "google_compute_network.custom-net.id") {
		t.Error("expected custom network reference")
	}
}

func TestGcpSubnetworkTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "sub3",
		Name:       "Default Subnet",
		Properties: map[string]interface{}{},
	}

	result, err := gcpSubnetworkTemplate(node)
	if err != nil {
		t.Fatalf("gcpSubnetworkTemplate() error = %v", err)
	}

	if !contains(result, "private_ip_google_access = true") {
		t.Error("expected private_ip_google_access = true (default)")
	}
	if !contains(result, "us-central1") {
		t.Error("expected default region")
	}
}

func TestGcpComputeInstanceTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "inst1",
		Name: "Web Server",
		Properties: map[string]interface{}{
			"name":         "web-instance",
			"machine_type": "e2-standard-2",
			"zone":         "us-west1-a",
			"image":        "debian-cloud/debian-11",
		},
	}

	result, err := gcpComputeInstanceTemplate(node)
	if err != nil {
		t.Fatalf("gcpComputeInstanceTemplate() error = %v", err)
	}

	if !contains(result, "google_compute_instance") {
		t.Error("expected google_compute_instance resource")
	}
	if !contains(result, "e2-standard-2") {
		t.Error("expected machine type")
	}
	if !contains(result, "us-west1-a") {
		t.Error("expected zone")
	}
	if !contains(result, "debian-cloud/debian-11") {
		t.Error("expected image")
	}
	if !contains(result, "google_compute_subnetwork.main.id") {
		t.Error("expected default subnetwork reference")
	}
}

func TestGcpComputeInstanceTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "inst2",
		Name:       "Default Instance",
		Properties: map[string]interface{}{},
	}

	result, err := gcpComputeInstanceTemplate(node)
	if err != nil {
		t.Fatalf("gcpComputeInstanceTemplate() error = %v", err)
	}

	if !contains(result, "e2-micro") {
		t.Error("expected default machine type e2-micro")
	}
	if !contains(result, "us-central1-a") {
		t.Error("expected default zone")
	}
	if !contains(result, "ubuntu-os-cloud/ubuntu-2204-lts") {
		t.Error("expected default image")
	}
}

func TestGcpComputeInstanceTemplate_CustomSubnet(t *testing.T) {
	node := model.DesignNode{
		ID:   "inst3",
		Name: "DB Instance",
		Properties: map[string]interface{}{
			"subnetId": "db-subnet",
		},
	}

	result, err := gcpComputeInstanceTemplate(node)
	if err != nil {
		t.Fatalf("gcpComputeInstanceTemplate() error = %v", err)
	}

	if !contains(result, "google_compute_subnetwork.db-subnet.id") {
		t.Error("expected custom subnetwork reference")
	}
}

func TestGcpStorageBucketTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "bucket1",
		Name: "Assets",
		Properties: map[string]interface{}{
			"name":       "my-assets",
			"location":   "US-WEST1",
			"project":    "assets-proj",
			"versioning": false,
		},
	}

	result, err := gcpStorageBucketTemplate(node)
	if err != nil {
		t.Fatalf("gcpStorageBucketTemplate() error = %v", err)
	}

	if !contains(result, "google_storage_bucket") {
		t.Error("expected google_storage_bucket resource")
	}
	if !contains(result, "my-assets") {
		t.Error("expected bucket name")
	}
	if !contains(result, "US-WEST1") {
		t.Error("expected location")
	}
	if !contains(result, "enabled = false") {
		t.Error("expected versioning disabled")
	}
}

func TestGcpStorageBucketTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "bucket2",
		Name:       "Default Bucket",
		Properties: map[string]interface{}{},
	}

	result, err := gcpStorageBucketTemplate(node)
	if err != nil {
		t.Fatalf("gcpStorageBucketTemplate() error = %v", err)
	}

	if !contains(result, "enabled = true") {
		t.Error("expected versioning enabled (default)")
	}
	if !contains(result, "US") {
		t.Error("expected default location")
	}
}

func TestGcpGetParentNetworkID_Exists(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{"network": "custom-net"}}
	result := getParentGCPNetwork(node)
	if result != "custom-net" {
		t.Errorf("getParentGCPNetwork() = %q, want %q", result, "custom-net")
	}
}

func TestGcpGetParentNetworkID_Default(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{}}
	result := getParentGCPNetwork(node)
	if result != "main" {
		t.Errorf("getParentGCPNetwork() = %q, want %q", result, "main")
	}
}

func TestGcpGetParentSubnetID_Exists(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{"subnetwork": "custom-subnet"}}
	result := getParentGCPSubnet(node)
	if result != "custom-subnet" {
		t.Errorf("getParentGCPSubnet() = %q, want %q", result, "custom-subnet")
	}
}

func TestGcpGetParentSubnetID_Default(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{}}
	result := getParentGCPSubnet(node)
	if result != "main" {
		t.Errorf("getParentGCPSubnet() = %q, want %q", result, "main")
	}
}
