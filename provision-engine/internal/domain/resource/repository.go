package resource

import "context"

// Repository is the port for resource persistence.
type Repository interface {
	Create(ctx context.Context, resource *ManagedResource) error
	GetByID(ctx context.Context, id string) (*ManagedResource, error)
	GetByAddress(ctx context.Context, address string) (*ManagedResource, error)
	Update(ctx context.Context, resource *ManagedResource) error
	Delete(ctx context.Context, id string) error
	ListByDeploymentID(ctx context.Context, deploymentID string) ([]*ManagedResource, error)
	ListByProvider(ctx context.Context, tenantID, provider string) ([]*ManagedResource, error)
	ListByState(ctx context.Context, state ResourceState) ([]*ManagedResource, error)
	CountByTenant(ctx context.Context, tenantID string) (int, error)
}

// Service contains domain services for resource operations.
type Service struct {
	repo Repository
}

// NewService creates a new resource domain service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// Create creates a new managed resource.
func (s *Service) Create(ctx context.Context, deploymentID, tenantID, provider, resType, name, address string, config map[string]interface{}) (*ManagedResource, error) {
	res := NewManagedResource(deploymentID, tenantID, provider, resType, name, address, config)
	if err := s.repo.Create(ctx, res); err != nil {
		return nil, err
	}
	return res, nil
}

// GetByID retrieves a resource by ID.
func (s *Service) GetByID(ctx context.Context, id string) (*ManagedResource, error) {
	return s.repo.GetByID(ctx, id)
}

// GetByAddress retrieves a resource by its cloud address.
func (s *Service) GetByAddress(ctx context.Context, address string) (*ManagedResource, error) {
	return s.repo.GetByAddress(ctx, address)
}

// ListByDeploymentID lists all resources for a deployment.
func (s *Service) ListByDeploymentID(ctx context.Context, deploymentID string) ([]*ManagedResource, error) {
	return s.repo.ListByDeploymentID(ctx, deploymentID)
}

// ListByProvider lists all resources for a provider.
func (s *Service) ListByProvider(ctx context.Context, tenantID, provider string) ([]*ManagedResource, error) {
	return s.repo.ListByProvider(ctx, tenantID, provider)
}

// ListDrifted lists all resources in DRIFTED state.
func (s *Service) ListDrifted(ctx context.Context) ([]*ManagedResource, error) {
	return s.repo.ListByState(ctx, RStateDrifted)
}
