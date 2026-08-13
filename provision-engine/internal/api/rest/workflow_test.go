package rest

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
	"github.com/cloudbuilder/provision-engine/internal/domain/workflow"
)

// ─── Mock Workflow Repository ──────────────────────────────────────────

type mockWorkflowRepo struct {
	data map[string]*workflow.Workflow
}

func newMockWorkflowRepo() *mockWorkflowRepo {
	return &mockWorkflowRepo{data: make(map[string]*workflow.Workflow)}
}

func (m *mockWorkflowRepo) Create(ctx context.Context, wf *workflow.Workflow) error {
	m.data[wf.ID] = wf
	return nil
}
func (m *mockWorkflowRepo) GetByID(ctx context.Context, id string) (*workflow.Workflow, error) {
	wf, ok := m.data[id]
	if !ok {
		return nil, shared.ErrNotFound("Workflow", id)
	}
	return wf, nil
}
func (m *mockWorkflowRepo) Update(ctx context.Context, wf *workflow.Workflow) error {
	m.data[wf.ID] = wf
	return nil
}
func (m *mockWorkflowRepo) GetByDeploymentID(ctx context.Context, deploymentID string) (*workflow.Workflow, error) {
	for _, wf := range m.data {
		if wf.DeploymentID == deploymentID {
			return wf, nil
		}
	}
	return nil, shared.ErrNotFound("Workflow", deploymentID)
}
func (m *mockWorkflowRepo) ListByStatus(ctx context.Context, status workflow.WorkflowStatus) ([]*workflow.Workflow, error) {
	return nil, nil
}

func createTestWorkflow(id, depID string) *workflow.Workflow {
	wf := &workflow.Workflow{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		DeploymentID: depID,
		Status:       workflow.WStatusPending,
		Steps: []workflow.WorkflowStep{
			{ID: "step-1", Name: "Create VPC", Type: workflow.StepTypeCreate, Status: workflow.SStatusPending},
			{ID: "step-2", Name: "Create Subnet", Type: workflow.StepTypeCreate, Status: workflow.SStatusPending, DependsOn: []string{"step-1"}},
		},
	}
	return wf
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW HANDLER TESTS
// ═══════════════════════════════════════════════════════════════════════════

func TestWorkflowHandler_Get(t *testing.T) {
	repo := newMockWorkflowRepo()
	wf := createTestWorkflow("wf-1", "dep-1")
	repo.data["wf-1"] = wf

	handler := NewWorkflowHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/workflows/wf-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp workflow.Workflow
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.ID != "wf-1" {
		t.Errorf("ID = %q, want %q", resp.ID, "wf-1")
	}
	if resp.DeploymentID != "dep-1" {
		t.Errorf("DeploymentID = %q, want %q", resp.DeploymentID, "dep-1")
	}
}

func TestWorkflowHandler_Get_NotFound(t *testing.T) {
	repo := newMockWorkflowRepo()
	handler := NewWorkflowHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/workflows/nonexistent", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestWorkflowHandler_ListSteps(t *testing.T) {
	repo := newMockWorkflowRepo()
	wf := createTestWorkflow("wf-1", "dep-1")
	repo.data["wf-1"] = wf

	handler := NewWorkflowHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/workflows/wf-1/steps", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["total"].(float64) != 2 {
		t.Errorf("total = %v, want 2", resp["total"])
	}
}
