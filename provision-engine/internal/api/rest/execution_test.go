package rest

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/execution"
	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// ─── Mock Execution Repository ─────────────────────────────────────────

type mockExecutionRepo struct {
	data map[string]*execution.Execution
}

func newMockExecutionRepo() *mockExecutionRepo {
	return &mockExecutionRepo{data: make(map[string]*execution.Execution)}
}

func (m *mockExecutionRepo) Create(ctx context.Context, e *execution.Execution) error {
	m.data[e.ID] = e
	return nil
}
func (m *mockExecutionRepo) GetByID(ctx context.Context, id string) (*execution.Execution, error) {
	e, ok := m.data[id]
	if !ok {
		return nil, shared.ErrNotFound("Execution", id)
	}
	return e, nil
}
func (m *mockExecutionRepo) Update(ctx context.Context, e *execution.Execution) error {
	m.data[e.ID] = e
	return nil
}
func (m *mockExecutionRepo) ListByWorkflowID(ctx context.Context, workflowID string) ([]*execution.Execution, error) {
	var result []*execution.Execution
	for _, e := range m.data {
		if e.WorkflowID == workflowID {
			result = append(result, e)
		}
	}
	return result, nil
}
func (m *mockExecutionRepo) ListByStatus(ctx context.Context, status execution.ExecutionStatus) ([]*execution.Execution, error) {
	return nil, nil
}

func createTestExecution(id, wfID string) *execution.Execution {
	now := time.Now().UTC()
	return &execution.Execution{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: now,
			UpdatedAt: now,
		},
		WorkflowID:   wfID,
		StepID:       "step-1",
		ExecutorType: "terraform",
		Status:       execution.ExStatusPending,
		WorkDir:      "/tmp/workspace",
		MaxRetries:   3,
		StartedAt:    &now,
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION HANDLER TESTS
// ═══════════════════════════════════════════════════════════════════════════

func TestExecutionHandler_Get(t *testing.T) {
	repo := newMockExecutionRepo()
	exec := createTestExecution("exec-1", "wf-1")
	repo.data["exec-1"] = exec

	handler := NewExecutionHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/executions/exec-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp execution.Execution
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.ID != "exec-1" {
		t.Errorf("ID = %q, want %q", resp.ID, "exec-1")
	}
	if resp.WorkflowID != "wf-1" {
		t.Errorf("WorkflowID = %q, want %q", resp.WorkflowID, "wf-1")
	}
}

func TestExecutionHandler_Get_NotFound(t *testing.T) {
	repo := newMockExecutionRepo()
	handler := NewExecutionHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/executions/nonexistent", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestExecutionHandler_List(t *testing.T) {
	repo := newMockExecutionRepo()
	repo.data["exec-1"] = createTestExecution("exec-1", "wf-1")
	repo.data["exec-2"] = createTestExecution("exec-2", "wf-1")
	repo.data["exec-3"] = createTestExecution("exec-3", "wf-2")

	handler := NewExecutionHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/executions?workflow_id=wf-1", nil)
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

func TestExecutionHandler_List_MissingWorkflowID(t *testing.T) {
	repo := newMockExecutionRepo()
	handler := NewExecutionHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/executions", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}
