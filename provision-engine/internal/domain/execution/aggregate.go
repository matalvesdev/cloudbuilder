package execution

import (
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// Execution is the aggregate root for a single execution operation.
type Execution struct {
	shared.AggregateRoot
	WorkflowID   string          `json:"workflowId"`
	StepID       string          `json:"stepId"`
	ExecutorType string          `json:"executorType"`
	ProviderType string          `json:"providerType"`
	Status       ExecutionStatus `json:"status"`
	Plan         *ExecutionPlan  `json:"plan,omitempty"`
	Result       *ExecutionResult `json:"result,omitempty"`
	WorkDir      string          `json:"workDir"`
	RetryCount   int             `json:"retryCount"`
	MaxRetries   int             `json:"maxRetries"`
	StartedAt    *time.Time      `json:"startedAt,omitempty"`
	CompletedAt  *time.Time      `json:"completedAt,omitempty"`
	Error        string          `json:"error,omitempty"`
	Logs         string          `json:"logs,omitempty"`
}

// NewExecution creates a new execution for a workflow step.
func NewExecution(workflowID, stepID, executorType, providerType, workDir string) *Execution {
	now := time.Now().UTC()
	return &Execution{
		AggregateRoot: shared.NewAggregateRoot(),
		WorkflowID:    workflowID,
		StepID:        stepID,
		ExecutorType:  executorType,
		ProviderType:  providerType,
		Status:        ExStatusPending,
		WorkDir:       workDir,
		MaxRetries:    3,
		StartedAt:     &now,
	}
}

// Start transitions the execution to RUNNING status.
func (e *Execution) Start() error {
	if e.Status != ExStatusPending {
		return shared.ErrInvalidState("Execution", string(e.Status))
	}
	now := time.Now().UTC()
	e.Status = ExStatusRunning
	e.StartedAt = &now
	e.RecordEvent(ExecutionStartedEvent{
		BaseEvent: shared.NewBaseEvent("execution.started", e.ID, "Execution", "", 0, nil),
	})
	return nil
}

// Complete transitions the execution to COMPLETED status.
func (e *Execution) Complete(result ExecutionResult) error {
	now := time.Now().UTC()
	e.Status = ExStatusCompleted
	e.Result = &result
	e.CompletedAt = &now
	e.RecordEvent(ExecutionCompletedEvent{
		BaseEvent: shared.NewBaseEvent("execution.completed", e.ID, "Execution", "", 0, nil),
	})
	return nil
}

// Fail transitions the execution to FAILED status.
func (e *Execution) Fail(err error) error {
	now := time.Now().UTC()
	e.Status = ExStatusFailed
	e.CompletedAt = &now
	if err != nil {
		e.Error = err.Error()
	}
	e.RecordEvent(ExecutionFailedEvent{
		BaseEvent: shared.NewBaseEvent("execution.failed", e.ID, "Execution", "", 0, nil),
		Error:     e.Error,
	})
	return nil
}

// Cancel transitions the execution to CANCELLED status.
func (e *Execution) Cancel() error {
	now := time.Now().UTC()
	e.Status = ExStatusCancelled
	e.CompletedAt = &now
	return nil
}

// CanRetry checks if the execution can be retried.
func (e *Execution) CanRetry() bool {
	return e.Status == ExStatusFailed && e.RetryCount < e.MaxRetries
}

// IncrementRetry increments the retry counter.
func (e *Execution) IncrementRetry() {
	e.RetryCount++
	e.Status = ExStatusPending
	e.Error = ""
}

// SetPlan stores the execution plan.
func (e *Execution) SetPlan(plan ExecutionPlan) {
	e.Plan = &plan
}
