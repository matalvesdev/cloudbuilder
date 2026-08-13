package resource

// ResourceState represents the current state of a managed resource.
type ResourceState string

const (
	RStatePending   ResourceState = "PENDING"
	RStateCreating  ResourceState = "CREATING"
	RStateActive    ResourceState = "ACTIVE"
	RStateUpdating  ResourceState = "UPDATING"
	RStateReplacing ResourceState = "REPLACING"
	RStateDeleting  ResourceState = "DELETING"
	RStateDeleted   ResourceState = "DELETED"
	RStateFailed    ResourceState = "FAILED"
	RStateDrifted   ResourceState = "DRIFTED"
)

// ResourceType identifies the kind of infrastructure resource.
type ResourceType string

const (
	ResourceTypeCompute    ResourceType = "compute"
	ResourceTypeNetwork    ResourceType = "network"
	ResourceTypeStorage    ResourceType = "storage"
	ResourceTypeDatabase   ResourceType = "database"
	ResourceTypeContainer  ResourceType = "container"
	ResourceTypeServerless ResourceType = "serverless"
	ResourceTypeCache      ResourceType = "cache"
	ResourceTypeCDN        ResourceType = "cdn"
	ResourceTypeDNS        ResourceType = "dns"
	ResourceTypeIAM        ResourceType = "iam"
	ResourceTypeSecret     ResourceType = "secret"
	ResourceTypeCustom     ResourceType = "custom"
)
