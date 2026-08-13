package deployment

import (
	"context"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// Repository is the port for deployment persistence.
type Repository interface {
	Create(ctx context.Context, deployment *Deployment) error
	GetByID(ctx context.Context, id string) (*Deployment, error)
	Update(ctx context.Context, deployment *Deployment) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, tenantID string, filter DeploymentFilter) ([]*Deployment, int, error)
	GetByStatus(ctx context.Context, status DeploymentStatus) ([]*Deployment, error)
	CountByTenant(ctx context.Context, tenantID string) (int, error)
}

// Service contains domain services for deployment operations.
type Service struct {
	repo Repository
}

// NewService creates a new deployment domain service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// Create creates a new deployment after validating business rules.
func (s *Service) Create(ctx context.Context, tenantID, name, description string, config DeploymentConfig) (*Deployment, error) {
	count, err := s.repo.CountByTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	// Business rule: max 1000 active deployments per tenant
	if count >= 1000 {
		return nil, shared.ErrConflict("Deployment", "max deployments per tenant reached")
	}

	d, err := NewDeployment(tenantID, name, description, config)
	if err != nil {
		return nil, err
	}

	if err := s.repo.Create(ctx, d); err != nil {
		return nil, err
	}

	return d, nil
}

// GetByID retrieves a deployment by ID.
func (s *Service) GetByID(ctx context.Context, id string) (*Deployment, error) {
	return s.repo.GetByID(ctx, id)
}

// List lists deployments for a tenant.
func (s *Service) List(ctx context.Context, tenantID string, filter DeploymentFilter) ([]*Deployment, int, error) {
	return s.repo.List(ctx, tenantID, filter)
}

// Cancel cancels a deployment.
func (s *Service) Cancel(ctx context.Context, id, reason string) error {
	d, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if err := d.Cancel(reason); err != nil {
		return err
	}

	return s.repo.Update(ctx, d)
}
