package workflow

import "context"

// Repository is the port for workflow persistence.
type Repository interface {
	Create(ctx context.Context, wf *Workflow) error
	GetByID(ctx context.Context, id string) (*Workflow, error)
	Update(ctx context.Context, wf *Workflow) error
	GetByDeploymentID(ctx context.Context, deploymentID string) (*Workflow, error)
	ListByStatus(ctx context.Context, status WorkflowStatus) ([]*Workflow, error)
}

// Service contains domain services for workflow operations.
type Service struct {
	repo Repository
}

// NewService creates a new workflow domain service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// Create creates a new workflow for a deployment.
func (s *Service) Create(ctx context.Context, deploymentID string) (*Workflow, error) {
	wf := NewWorkflow(deploymentID)
	if err := s.repo.Create(ctx, wf); err != nil {
		return nil, err
	}
	return wf, nil
}

// GetByID retrieves a workflow by ID.
func (s *Service) GetByID(ctx context.Context, id string) (*Workflow, error) {
	return s.repo.GetByID(ctx, id)
}

// GetByDeploymentID retrieves the workflow for a deployment.
func (s *Service) GetByDeploymentID(ctx context.Context, deploymentID string) (*Workflow, error) {
	return s.repo.GetByDeploymentID(ctx, deploymentID)
}
