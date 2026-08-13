package deployment

import (
	"testing"
	"time"
)

func TestNewDeployment(t *testing.T) {
	cfg := DeploymentConfig{
		ExecutorType: "terraform",
		ProviderType: "aws",
		AutoApprove:  false,
	}

	dep, err := NewDeployment("tenant-1", "test-deploy", "test description", cfg)
	if err != nil {
		t.Fatalf("NewDeployment() error = %v", err)
	}

	if dep.ID == "" {
		t.Error("expected non-empty ID")
	}
	if dep.TenantID != "tenant-1" {
		t.Errorf("TenantID = %q, want %q", dep.TenantID, "tenant-1")
	}
	if dep.Name != "test-deploy" {
		t.Errorf("Name = %q, want %q", dep.Name, "test-deploy")
	}
	if dep.Status != StatusPending {
		t.Errorf("Status = %q, want %q", dep.Status, StatusPending)
	}
	if dep.Config.ExecutorType != "terraform" {
		t.Errorf("ExecutorType = %q, want %q", dep.Config.ExecutorType, "terraform")
	}
}

func TestNewDeployment_InvalidConfig(t *testing.T) {
	cfg := DeploymentConfig{
		ExecutorType: "",
		ProviderType: "aws",
	}

	_, err := NewDeployment("tenant-1", "test", "", cfg)
	if err == nil {
		t.Fatal("expected error for empty executor type")
	}
}

func TestDeployment_Submit(t *testing.T) {
	dep := createTestDeployment(t)

	if err := dep.Submit(); err != nil {
		t.Fatalf("Submit() error = %v", err)
	}
	if dep.Status != StatusPlanning {
		t.Errorf("Status = %q, want %q", dep.Status, StatusPlanning)
	}
}

func TestDeployment_Submit_InvalidTransition(t *testing.T) {
	dep := createTestDeployment(t)
	dep.Status = StatusApplied

	if err := dep.Submit(); err == nil {
		t.Fatal("expected error for invalid transition")
	}
}

func TestDeployment_PlanComplete(t *testing.T) {
	dep := createTestDeployment(t)
	dep.Submit()

	if err := dep.PlanComplete("wf-1"); err != nil {
		t.Fatalf("PlanComplete() error = %v", err)
	}
	if dep.Status != StatusPlanned {
		t.Errorf("Status = %q, want %q", dep.Status, StatusPlanned)
	}
	if dep.WorkflowID != "wf-1" {
		t.Errorf("WorkflowID = %q, want %q", dep.WorkflowID, "wf-1")
	}
}

func TestDeployment_Approve(t *testing.T) {
	dep := createTestDeployment(t)
	dep.Submit()
	dep.PlanComplete("wf-1")

	if err := dep.Approve("admin"); err != nil {
		t.Fatalf("Approve() error = %v", err)
	}
	if dep.Status != StatusExecuting {
		t.Errorf("Status = %q, want %q", dep.Status, StatusExecuting)
	}
}

func TestDeployment_Complete(t *testing.T) {
	dep := createTestDeployment(t)
	dep.Submit()
	dep.PlanComplete("wf-1")
	dep.Approve("admin")

	if err := dep.Complete(); err != nil {
		t.Fatalf("Complete() error = %v", err)
	}
	if dep.Status != StatusApplied {
		t.Errorf("Status = %q, want %q", dep.Status, StatusApplied)
	}
}

func TestDeployment_Fail(t *testing.T) {
	dep := createTestDeployment(t)
	dep.Submit()
	dep.PlanComplete("wf-1")
	dep.Approve("admin")

	if err := dep.Fail(nil); err != nil {
		t.Fatalf("Fail() error = %v", err)
	}
	if dep.Status != StatusFailed {
		t.Errorf("Status = %q, want %q", dep.Status, StatusFailed)
	}
}

func TestDeployment_Cancel(t *testing.T) {
	dep := createTestDeployment(t)

	if err := dep.Cancel("user request"); err != nil {
		t.Fatalf("Cancel() error = %v", err)
	}
	if dep.Status != StatusCancelled {
		t.Errorf("Status = %q, want %q", dep.Status, StatusCancelled)
	}
}

func TestDeployment_StartDestroy(t *testing.T) {
	dep := createTestDeployment(t)
	dep.Submit()
	dep.PlanComplete("wf-1")
	dep.Approve("admin")
	dep.Complete()

	if err := dep.StartDestroy(); err != nil {
		t.Fatalf("StartDestroy() error = %v", err)
	}
	if dep.Status != StatusDestroying {
		t.Errorf("Status = %q, want %q", dep.Status, StatusDestroying)
	}
}

func TestDeployment_DestroyComplete(t *testing.T) {
	dep := createTestDeployment(t)
	dep.Submit()
	dep.PlanComplete("wf-1")
	dep.Approve("admin")
	dep.Complete()
	dep.StartDestroy()

	if err := dep.DestroyComplete(); err != nil {
		t.Fatalf("DestroyComplete() error = %v", err)
	}
	if dep.Status != StatusDestroyed {
		t.Errorf("Status = %q, want %q", dep.Status, StatusDestroyed)
	}
}

func TestDeployment_Events(t *testing.T) {
	dep := createTestDeployment(t)
	dep.Submit()

	events := dep.PullEvents()
	if len(events) == 0 {
		t.Fatal("expected events after Submit")
	}

	found := false
	for _, e := range events {
		if e.EventType() == "deployment.status_changed" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected deployment.status_changed event")
	}
}

func TestStatusCanTransitionTo(t *testing.T) {
	tests := []struct {
		from   DeploymentStatus
		to     DeploymentStatus
		valid  bool
	}{
		{StatusPending, StatusPlanning, true},
		{StatusPending, StatusApplied, false},
		{StatusPlanning, StatusPlanned, true},
		{StatusPlanning, StatusFailed, true},
		{StatusApplied, StatusDrifted, true},
		{StatusApplied, StatusDestroying, true},
		{StatusDestroyed, StatusPending, false},
	}

	for _, tt := range tests {
		if got := tt.from.CanTransitionTo(tt.to); got != tt.valid {
			t.Errorf("%s → %s: got %v, want %v", tt.from, tt.to, got, tt.valid)
		}
	}
}

func TestDeploymentConfig_Validate(t *testing.T) {
	valid := DeploymentConfig{ExecutorType: "terraform", ProviderType: "aws"}
	if err := valid.Validate(); err != nil {
		t.Errorf("valid config should not error, got: %v", err)
	}

	invalid := DeploymentConfig{ExecutorType: "", ProviderType: "aws"}
	if err := invalid.Validate(); err == nil {
		t.Error("expected error for empty executor type")
	}
}

func createTestDeployment(t *testing.T) *Deployment {
	t.Helper()
	cfg := DeploymentConfig{
		ExecutorType: "terraform",
		ProviderType: "aws",
	}
	dep, err := NewDeployment("tenant-1", "test", "", cfg)
	if err != nil {
		t.Fatalf("createTestDeployment: %v", err)
	}
	_ = time.Now() // ensure time import is used
	return dep
}
