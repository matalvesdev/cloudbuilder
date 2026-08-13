package execution

import "context"

// Repository is the port for execution persistence.
type Repository interface {
	Create(ctx context.Context, exec *Execution) error
	GetByID(ctx context.Context, id string) (*Execution, error)
	Update(ctx context.Context, exec *Execution) error
	ListByWorkflowID(ctx context.Context, workflowID string) ([]*Execution, error)
	ListByStatus(ctx context.Context, status ExecutionStatus) ([]*Execution, error)
}

// Service contains domain services for execution operations.
type Service struct {
	repo Repository
}

// NewService creates a new execution domain service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// Create creates a new execution.
func (s *Service) Create(ctx context.Context, workflowID, stepID, executorType, providerType, workDir string) (*Execution, error) {
	exec := NewExecution(workflowID, stepID, executorType, providerType, workDir)
	if err := s.repo.Create(ctx, exec); err != nil {
		return nil, err
	}
	return exec, nil
}

// GetByID retrieves an execution by ID.
func (s *Service) GetByID(ctx context.Context, id string) (*Execution, error) {
	return s.repo.GetByID(ctx, id)
}

// ListByWorkflowID lists all executions for a workflow.
func (s *Service) ListByWorkflowID(ctx context.Context, workflowID string) ([]*Execution, error) {
	return s.repo.ListByWorkflowID(ctx, workflowID)
}
