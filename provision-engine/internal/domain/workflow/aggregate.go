package workflow

import (
	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// WorkflowStep represents a single step in a workflow.
type WorkflowStep struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Type       StepType          `json:"type"`
	ResourceID string            `json:"resourceId,omitempty"`
	Config     map[string]string `json:"config,omitempty"`
	DependsOn  []string          `json:"dependsOn,omitempty"`
	Status     StepStatus        `json:"status"`
	Result     *StepResult       `json:"result,omitempty"`
	RetryMax   int               `json:"retryMax"`
	Timeout    int64             `json:"timeout"` // seconds
}

// CanExecute checks if all dependencies are satisfied.
func (s *WorkflowStep) CanExecute(completedSteps map[string]bool) bool {
	for _, dep := range s.DependsOn {
		if !completedSteps[dep] {
			return false
		}
	}
	return true
}

// Workflow is the aggregate root for workflow orchestration.
type Workflow struct {
	shared.AggregateRoot
	DeploymentID string         `json:"deploymentId"`
	Status       WorkflowStatus `json:"status"`
	Steps        []WorkflowStep `json:"steps"`
	CurrentBatch int            `json:"currentBatch"`
	Error        string         `json:"error,omitempty"`
}

// NewWorkflow creates a new workflow for a deployment.
func NewWorkflow(deploymentID string) *Workflow {
	return &Workflow{
		AggregateRoot: shared.NewAggregateRoot(),
		DeploymentID:  deploymentID,
		Status:        WStatusPending,
		Steps:         make([]WorkflowStep, 0),
	}
}

// AddStep adds a step to the workflow.
func (w *Workflow) AddStep(step WorkflowStep) {
	if step.RetryMax == 0 {
		step.RetryMax = 3
	}
	step.Status = SStatusPending
	w.Steps = append(w.Steps, step)
}

// Start transitions the workflow to RUNNING status.
func (w *Workflow) Start() error {
	if w.Status != WStatusPending {
		return shared.ErrInvalidState("Workflow", string(w.Status))
	}
	w.Status = WStatusRunning
	w.RecordEvent(WorkflowStartedEvent{
		BaseEvent: shared.NewBaseEvent("workflow.started", w.ID, "Workflow", "", 0, nil),
	})
	return nil
}

// CompleteStep marks a step as completed.
func (w *Workflow) CompleteStep(stepID string, result StepResult) error {
	for i := range w.Steps {
		if w.Steps[i].ID == stepID {
			w.Steps[i].Status = SStatusCompleted
			w.Steps[i].Result = &result
			w.RecordEvent(WorkflowStepCompletedEvent{
				BaseEvent: shared.NewBaseEvent("workflow.step.completed", w.ID, "Workflow", "", 0, nil),
				StepID:    stepID,
			})
			return nil
		}
	}
	return shared.ErrNotFound("WorkflowStep", stepID)
}

// FailStep marks a step as failed.
func (w *Workflow) FailStep(stepID string, err error) error {
	for i := range w.Steps {
		if w.Steps[i].ID == stepID {
			w.Steps[i].Status = SStatusFailed
			w.Steps[i].Result = &StepResult{
				Success: false,
				Error:   err.Error(),
			}
			return nil
		}
	}
	return shared.ErrNotFound("WorkflowStep", stepID)
}

// NextExecutable returns all steps that can be executed now.
func (w *Workflow) NextExecutable() []WorkflowStep {
	completed := make(map[string]bool)
	for _, s := range w.Steps {
		if s.Status == SStatusCompleted {
			completed[s.ID] = true
		}
	}

	var executable []WorkflowStep
	for _, s := range w.Steps {
		if s.Status == SStatusPending && s.CanExecute(completed) {
			executable = append(executable, s)
		}
	}
	return executable
}

// AllCompleted checks if all steps are completed.
func (w *Workflow) AllCompleted() bool {
	for _, s := range w.Steps {
		if s.Status != SStatusCompleted && s.Status != SStatusSkipped {
			return false
		}
	}
	return true
}

// AnyFailed checks if any step has failed.
func (w *Workflow) AnyFailed() bool {
	for _, s := range w.Steps {
		if s.Status == SStatusFailed {
			return true
		}
	}
	return false
}

// Complete transitions the workflow to COMPLETED status.
func (w *Workflow) Complete() error {
	if !w.AllCompleted() {
		return shared.ErrInvalidState("Workflow", "not all steps completed")
	}
	w.Status = WStatusCompleted
	w.RecordEvent(WorkflowCompletedEvent{
		BaseEvent: shared.NewBaseEvent("workflow.completed", w.ID, "Workflow", "", 0, nil),
	})
	return nil
}

// Fail transitions the workflow to FAILED status.
func (w *Workflow) Fail(err error) error {
	w.Status = WStatusFailed
	if err != nil {
		w.Error = err.Error()
	}
	return nil
}
