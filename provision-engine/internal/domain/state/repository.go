package state

import "context"

// Repository is the port for state persistence.
type Repository interface {
	Create(ctx context.Context, state *StateEntry) error
	GetByID(ctx context.Context, id string) (*StateEntry, error)
	GetByResourceID(ctx context.Context, resourceID string) (*StateEntry, error)
	Update(ctx context.Context, state *StateEntry) error
	GetVersion(ctx context.Context, resourceID string, version int) (*StateEntry, error)
	ListVersions(ctx context.Context, resourceID string) ([]StateVersion, error)
	ListByStatus(ctx context.Context, status StateStatus) ([]*StateEntry, error)
}

// Service contains domain services for state operations.
type Service struct {
	repo Repository
}

// NewService creates a new state domain service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// Create creates a new state entry.
func (s *Service) Create(ctx context.Context, resourceID, deploymentID, tenantID string, desiredState map[string]interface{}) (*StateEntry, error) {
	state := NewStateEntry(resourceID, deploymentID, tenantID, desiredState)
	if err := s.repo.Create(ctx, state); err != nil {
		return nil, err
	}
	return state, nil
}

// GetByResourceID retrieves state for a resource.
func (s *Service) GetByResourceID(ctx context.Context, resourceID string) (*StateEntry, error) {
	return s.repo.GetByResourceID(ctx, resourceID)
}

// GetVersion retrieves a specific version of state.
func (s *Service) GetVersion(ctx context.Context, resourceID string, version int) (*StateEntry, error) {
	return s.repo.GetVersion(ctx, resourceID, version)
}

// ListDrifted lists all resources with drift.
func (s *Service) ListDrifted(ctx context.Context) ([]*StateEntry, error) {
	return s.repo.ListByStatus(ctx, Drifted)
}
