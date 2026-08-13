package workflow

import (
	"fmt"
	"testing"
)

func TestNewWorkflow(t *testing.T) {
	wf := NewWorkflow("dep-1")
	if wf.ID == "" {
		t.Error("expected non-empty ID")
	}
	if wf.DeploymentID != "dep-1" {
		t.Errorf("DeploymentID = %q, want %q", wf.DeploymentID, "dep-1")
	}
	if wf.Status != WStatusPending {
		t.Errorf("Status = %q, want %q", wf.Status, WStatusPending)
	}
}

func TestWorkflow_AddStep(t *testing.T) {
	wf := NewWorkflow("dep-1")
	wf.AddStep(WorkflowStep{
		ID:   "step-1",
		Name: "Create VPC",
		Type: StepTypeCreate,
	})

	if len(wf.Steps) != 1 {
		t.Fatalf("expected 1 step, got %d", len(wf.Steps))
	}
	if wf.Steps[0].Status != SStatusPending {
		t.Errorf("step status = %q, want %q", wf.Steps[0].Status, SStatusPending)
	}
	if wf.Steps[0].RetryMax != 3 {
		t.Errorf("retry max = %d, want 3", wf.Steps[0].RetryMax)
	}
}

func TestWorkflow_Start(t *testing.T) {
	wf := NewWorkflow("dep-1")
	if err := wf.Start(); err != nil {
		t.Fatalf("Start() error = %v", err)
	}
	if wf.Status != WStatusRunning {
		t.Errorf("Status = %q, want %q", wf.Status, WStatusRunning)
	}
}

func TestWorkflow_Start_InvalidTransition(t *testing.T) {
	wf := NewWorkflow("dep-1")
	wf.Status = WStatusCompleted

	if err := wf.Start(); err == nil {
		t.Fatal("expected error for invalid transition")
	}
}

func TestWorkflow_CompleteStep(t *testing.T) {
	wf := NewWorkflow("dep-1")
	wf.AddStep(WorkflowStep{ID: "step-1", Name: "Create VPC"})
	wf.AddStep(WorkflowStep{ID: "step-2", Name: "Create Subnet", DependsOn: []string{"step-1"}})

	if err := wf.CompleteStep("step-1", StepResult{Success: true}); err != nil {
		t.Fatalf("CompleteStep() error = %v", err)
	}

	if wf.Steps[0].Status != SStatusCompleted {
		t.Errorf("step 1 status = %q, want %q", wf.Steps[0].Status, SStatusCompleted)
	}
}

func TestWorkflow_CompleteStep_NotFound(t *testing.T) {
	wf := NewWorkflow("dep-1")
	wf.AddStep(WorkflowStep{ID: "step-1", Name: "Create VPC"})

	err := wf.CompleteStep("nonexistent", StepResult{Success: true})
	if err == nil {
		t.Fatal("expected error for nonexistent step")
	}
}

func TestWorkflow_NextExecutable(t *testing.T) {
	wf := NewWorkflow("dep-1")
	wf.AddStep(WorkflowStep{ID: "step-1", Name: "Create VPC"})
	wf.AddStep(WorkflowStep{ID: "step-2", Name: "Create Subnet", DependsOn: []string{"step-1"}})
	wf.AddStep(WorkflowStep{ID: "step-3", Name: "Create SG", DependsOn: []string{"step-1"}})

	next := wf.NextExecutable()
	if len(next) != 1 {
		t.Fatalf("expected 1 executable step, got %d", len(next))
	}
	if next[0].ID != "step-1" {
		t.Errorf("expected step-1, got %s", next[0].ID)
	}

	// Complete step-1
	wf.CompleteStep("step-1", StepResult{Success: true})

	next = wf.NextExecutable()
	if len(next) != 2 {
		t.Fatalf("expected 2 executable steps, got %d", len(next))
	}
}

func TestWorkflow_AllCompleted(t *testing.T) {
	wf := NewWorkflow("dep-1")
	wf.AddStep(WorkflowStep{ID: "step-1", Name: "Create VPC"})
	wf.AddStep(WorkflowStep{ID: "step-2", Name: "Create Subnet"})

	if wf.AllCompleted() {
		t.Error("expected not all completed")
	}

	wf.CompleteStep("step-1", StepResult{Success: true})
	wf.CompleteStep("step-2", StepResult{Success: true})

	if !wf.AllCompleted() {
		t.Error("expected all completed")
	}
}

func TestWorkflow_AnyFailed(t *testing.T) {
	wf := NewWorkflow("dep-1")
	wf.AddStep(WorkflowStep{ID: "step-1", Name: "Create VPC"})

	if wf.AnyFailed() {
		t.Error("expected no failures")
	}

	wf.FailStep("step-1", fmt.Errorf("creation failed"))

	if !wf.AnyFailed() {
		t.Error("expected failure")
	}
}

func TestWorkflow_Complete(t *testing.T) {
	wf := NewWorkflow("dep-1")
	wf.AddStep(WorkflowStep{ID: "step-1", Name: "Create VPC"})
	wf.Start()
	wf.CompleteStep("step-1", StepResult{Success: true})

	if err := wf.Complete(); err != nil {
		t.Fatalf("Complete() error = %v", err)
	}
	if wf.Status != WStatusCompleted {
		t.Errorf("Status = %q, want %q", wf.Status, WStatusCompleted)
	}
}

func TestWorkflow_Complete_NotAllDone(t *testing.T) {
	wf := NewWorkflow("dep-1")
	wf.AddStep(WorkflowStep{ID: "step-1", Name: "Create VPC"})
	wf.AddStep(WorkflowStep{ID: "step-2", Name: "Create Subnet"})
	wf.Start()
	wf.CompleteStep("step-1", StepResult{Success: true})

	if err := wf.Complete(); err == nil {
		t.Fatal("expected error when not all steps completed")
	}
}

func TestStepCanExecute(t *testing.T) {
	step := WorkflowStep{
		ID:        "step-2",
		DependsOn: []string{"step-1"},
	}

	completed := map[string]bool{"step-1": true}
	if !step.CanExecute(completed) {
		t.Error("expected step to be executable when deps met")
	}

	completed = map[string]bool{}
	if step.CanExecute(completed) {
		t.Error("expected step not executable when deps not met")
	}
}
