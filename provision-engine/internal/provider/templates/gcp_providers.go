package templates

// gcpTemplates returns the GCP resource template map.
func gcpTemplates() map[string]ResourceTemplate {
	return map[string]ResourceTemplate{
		"google_compute_network":    gcpComputeNetworkTemplate,
		"google_compute_subnetwork": gcpSubnetworkTemplate,
		"google_compute_instance":   gcpComputeInstanceTemplate,
		"google_storage_bucket":     gcpStorageBucketTemplate,
		"compute_network":           gcpComputeNetworkTemplate,
		"vpc":                       gcpComputeNetworkTemplate,
		"network":                   gcpComputeNetworkTemplate,
		"subnetwork":                gcpSubnetworkTemplate,
		"subnet":                    gcpSubnetworkTemplate,
		"instance":                  gcpComputeInstanceTemplate,
		"compute_instance":          gcpComputeInstanceTemplate,
		"gce":                       gcpComputeInstanceTemplate,
		"storage_bucket":            gcpStorageBucketTemplate,
		"bucket":                    gcpStorageBucketTemplate,
		"gcs":                       gcpStorageBucketTemplate,
	}
}
