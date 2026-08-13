package plugin

import "context"

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

// ProviderAuth holds authentication credentials.
type ProviderAuth struct {
	Type        string            `json:"type"`
	Credentials map[string]string `json:"credentials"`
	Expiry      *string           `json:"expiry,omitempty"`
}

// ResourceInfo describes a resource returned by a provider.
type ResourceInfo struct {
	ID       string                 `json:"id"`
	Type     string                 `json:"type"`
	Name     string                 `json:"name"`
	Status   string                 `json:"status"`
	Provider string                 `json:"provider"`
	Region   string                 `json:"region,omitempty"`
	Tags     map[string]string      `json:"tags,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// PricingInfo provides pricing information for a resource type.
type PricingInfo struct {
	ResourceType string  `json:"resourceType"`
	Unit         string  `json:"unit"`
	PricePerUnit float64 `json:"pricePerUnit"`
	Currency     string  `json:"currency"`
	Region       string  `json:"region"`
}

// Provider is the interface all cloud/SaaS providers must implement.
// Each provider wraps the SDK/API of a specific cloud or SaaS platform.
type Provider interface {
	Plugin

	// Type returns the provider type.
	Type() ProviderType

	// Name returns the human-readable provider name.
	Name() string

	// Authenticate validates and stores credentials.
	Authenticate(ctx context.Context, auth ProviderAuth) error

	// Capabilities returns what this provider supports.
	Capabilities() []ProviderCapability

	// ValidateConfig validates provider configuration.
	ValidateConfig(config map[string]string) error

	// HealthCheck verifies the provider is accessible.
	HealthCheck(ctx context.Context) error

	// ListResources lists all resources of a given type.
	ListResources(ctx context.Context, resourceType string) ([]ResourceInfo, error)

	// GetResource returns details of a specific resource.
	GetResource(ctx context.Context, resourceType, resourceID string) (*ResourceInfo, error)

	// EstimateCost estimates the cost of a resource configuration.
	EstimateCost(ctx context.Context, resourceType string, config map[string]string) (*CostEstimate, error)

	// GetPricing returns pricing information for a resource type.
	GetPricing(ctx context.Context, resourceType, region string) (*PricingInfo, error)
}
