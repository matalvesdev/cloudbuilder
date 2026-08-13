package provider

import (
	"context"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// Provider is the aggregate root for a cloud/SaaS provider configuration.
type Provider struct {
	shared.AggregateRoot
	TenantID     string             `json:"tenantId"`
	Type         ProviderType       `json:"type"`
	Name         string             `json:"name"`
	Status       ProviderStatus     `json:"status"`
	Config       map[string]string  `json:"config"`
	Capabilities []ProviderCapability `json:"capabilities"`
	LastHealth   *string            `json:"lastHealth,omitempty"`
}

// NewProvider creates a new provider configuration.
func NewProvider(tenantID string, providerType ProviderType, name string, config map[string]string) *Provider {
	return &Provider{
		AggregateRoot: shared.NewAggregateRoot(),
		TenantID:      tenantID,
		Type:          providerType,
		Name:          name,
		Status:        ProviderStatusUnknown,
		Config:        config,
		Capabilities:  make([]ProviderCapability, 0),
	}
}

// UpdateHealth updates the provider health status.
func (p *Provider) UpdateHealth(status ProviderStatus) {
	p.Status = status
}

// AddCapability adds a capability to the provider.
func (p *Provider) AddCapability(cap ProviderCapability) {
	for _, c := range p.Capabilities {
		if c == cap {
			return
		}
	}
	p.Capabilities = append(p.Capabilities, cap)
}

// HasCapability checks if the provider has a specific capability.
func (p *Provider) HasCapability(cap ProviderCapability) bool {
	for _, c := range p.Capabilities {
		if c == cap {
			return true
		}
	}
	return false
}

// Repository is the port for provider persistence.
type Repository interface {
	Create(ctx context.Context, provider *Provider) error
	GetByID(ctx context.Context, id string) (*Provider, error)
	GetByTypeAndTenant(ctx context.Context, tenantID string, providerType ProviderType) (*Provider, error)
	Update(ctx context.Context, provider *Provider) error
	Delete(ctx context.Context, id string) error
	ListByTenant(ctx context.Context, tenantID string) ([]*Provider, error)
}
