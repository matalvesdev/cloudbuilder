package provider

// ProviderType identifies the cloud/SaaS provider.
type ProviderType string

const (
	ProviderAWS          ProviderType = "aws"
	ProviderAzure        ProviderType = "azure"
	ProviderGCP          ProviderType = "gcp"
	ProviderOracle       ProviderType = "oracle"
	ProviderHetzner      ProviderType = "hetzner"
	ProviderDigitalOcean ProviderType = "digitalocean"
	ProviderCloudflare   ProviderType = "cloudflare"
	ProviderGitHub       ProviderType = "github"
	ProviderGitLab       ProviderType = "gitlab"
	ProviderVercel       ProviderType = "vercel"
	ProviderRailway      ProviderType = "railway"
	ProviderRender       ProviderType = "render"
	ProviderSupabase     ProviderType = "supabase"
)

// ProviderStatus represents the health status of a provider.
type ProviderStatus string

const (
	ProviderStatusHealthy   ProviderStatus = "HEALTHY"
	ProviderStatusDegraded  ProviderStatus = "DEGRADED"
	ProviderStatusUnhealthy ProviderStatus = "UNHEALTHY"
	ProviderStatusUnknown   ProviderStatus = "UNKNOWN"
)

// ProviderAuth holds authentication credentials.
type ProviderAuth struct {
	Type        string            `json:"type"` // api_key, oauth2, service_account
	Credentials map[string]string `json:"credentials"`
	Expiry      *string           `json:"expiry,omitempty"`
}

// ProviderCapability describes what a provider supports.
type ProviderCapability string

const (
	CapProvision  ProviderCapability = "provision"
	CapDestroy    ProviderCapability = "destroy"
	CapImport     ProviderCapability = "import"
	CapList       ProviderCapability = "list"
	CapCost       ProviderCapability = "cost_estimate"
	CapDrift      ProviderCapability = "drift_detection"
)

// ResourceInfo describes a resource returned by a provider.
type ResourceInfo struct {
	ID         string            `json:"id"`
	Type       string            `json:"type"`
	Name       string            `json:"name"`
	Status     string            `json:"status"`
	Provider   string            `json:"provider"`
	Region     string            `json:"region,omitempty"`
	Tags       map[string]string `json:"tags,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// PricingInfo provides pricing information for a resource type.
type PricingInfo struct {
	ResourceType string  `json:"resourceType"`
	Unit         string  `json:"unit"`
	PricePerUnit float64 `json:"pricePerUnit"`
	Currency     string  `json:"currency"`
	Region       string  `json:"region"`
}
