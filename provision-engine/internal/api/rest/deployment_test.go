package rest

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// ─── Mock Deployment Repository ─────────────────────────────────────────

type mockDeploymentRepo struct {
	data       map[string]*deployment.Deployment
	tenants    map[string][]*deployment.Deployment
	createErr  error
	getErr     error
	updateErr  error
	deleteErr  error
	listErr    error
	countCalls int
}

func newMockDeploymentRepo() *mockDeploymentRepo {
	return &mockDeploymentRepo{
		data:    make(map[string]*deployment.Deployment),
		tenants: make(map[string][]*deployment.Deployment),
	}
}

func (m *mockDeploymentRepo) Create(ctx context.Context, d *deployment.Deployment) error {
	if m.createErr != nil {
		return m.createErr
	}
	m.data[d.ID] = d
	m.tenants[d.TenantID] = append(m.tenants[d.TenantID], d)
	return nil
}

func (m *mockDeploymentRepo) GetByID(ctx context.Context, id string) (*deployment.Deployment, error) {
	if m.getErr != nil {
		return nil, m.getErr
	}
	d, ok := m.data[id]
	if !ok {
		return nil, shared.ErrNotFound("Deployment", id)
	}
	return d, nil
}

func (m *mockDeploymentRepo) Update(ctx context.Context, d *deployment.Deployment) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	m.data[d.ID] = d
	return nil
}

func (m *mockDeploymentRepo) Delete(ctx context.Context, id string) error {
	if m.deleteErr != nil {
		return m.deleteErr
	}
	delete(m.data, id)
	return nil
}

func (m *mockDeploymentRepo) List(ctx context.Context, tenantID string, filter deployment.DeploymentFilter) ([]*deployment.Deployment, int, error) {
	if m.listErr != nil {
		return nil, 0, m.listErr
	}
	result := m.tenants[tenantID]
	if result == nil {
		result = make([]*deployment.Deployment, 0)
	}
	return result, len(result), nil
}

func (m *mockDeploymentRepo) GetByStatus(ctx context.Context, status deployment.DeploymentStatus) ([]*deployment.Deployment, error) {
	return nil, nil
}

func (m *mockDeploymentRepo) CountByTenant(ctx context.Context, tenantID string) (int, error) {
	m.countCalls++
	return len(m.tenants[tenantID]), nil
}

// ─── Helper ─────────────────────────────────────────────────────────────

func createTestDep(id string) *deployment.Deployment {
	d := &deployment.Deployment{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		TenantID: "tenant-1",
		Name:     "test-deployment",
		Status:   deployment.StatusPending,
		Config: deployment.DeploymentConfig{
			ExecutorType: "terraform",
			ProviderType: "aws",
		},
		Metadata: make(map[string]string),
	}
	return d
}

func mustJSON(v interface{}) []byte {
	b, _ := json.Marshal(v)
	return b
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPLOYMENT HANDLER TESTS
// ═══════════════════════════════════════════════════════════════════════════

func TestDeploymentHandler_List(t *testing.T) {
	repo := newMockDeploymentRepo()
	repo.tenants["tenant-1"] = []*deployment.Deployment{
		createTestDep("dep-1"),
		createTestDep("dep-2"),
	}

	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/deployments?tenant_id=tenant-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["total"].(float64) != 2 {
		t.Errorf("total = %v, want 2", resp["total"])
	}
}

func TestDeploymentHandler_List_EmptyTenant(t *testing.T) {
	repo := newMockDeploymentRepo()
	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/deployments", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestDeploymentHandler_Create(t *testing.T) {
	repo := newMockDeploymentRepo()
	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := map[string]interface{}{
		"tenantId": "tenant-1",
		"name":     "my-deploy",
		"config": map[string]interface{}{
			"executorType": "terraform",
			"providerType": "aws",
		},
	}

	req := httptest.NewRequest("POST", "/api/v1/deployments", bytes.NewReader(mustJSON(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusCreated, w.Body.String())
	}

	var resp deployment.Deployment
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Name != "my-deploy" {
		t.Errorf("Name = %q, want %q", resp.Name, "my-deploy")
	}
	if resp.Status != deployment.StatusPending {
		t.Errorf("Status = %q, want %q", resp.Status, deployment.StatusPending)
	}
}

func TestDeploymentHandler_Create_InvalidBody(t *testing.T) {
	repo := newMockDeploymentRepo()
	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/deployments", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestDeploymentHandler_Create_InvalidConfig(t *testing.T) {
	repo := newMockDeploymentRepo()
	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := map[string]interface{}{
		"tenantId": "tenant-1",
		"name":     "bad-deploy",
		"config": map[string]interface{}{
			"executorType": "",
			"providerType": "aws",
		},
	}

	req := httptest.NewRequest("POST", "/api/v1/deployments", bytes.NewReader(mustJSON(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusBadRequest, w.Body.String())
	}
}

func TestDeploymentHandler_Get(t *testing.T) {
	repo := newMockDeploymentRepo()
	dep := createTestDep("dep-1")
	dep.Name = "found-deploy"
	repo.data["dep-1"] = dep

	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/deployments/dep-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp deployment.Deployment
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Name != "found-deploy" {
		t.Errorf("Name = %q, want %q", resp.Name, "found-deploy")
	}
}

func TestDeploymentHandler_Get_NotFound(t *testing.T) {
	repo := newMockDeploymentRepo()
	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/deployments/nonexistent", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestDeploymentHandler_Update(t *testing.T) {
	repo := newMockDeploymentRepo()
	dep := createTestDep("dep-1")
	repo.data["dep-1"] = dep

	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := map[string]string{"name": "updated-name"}
	req := httptest.NewRequest("PUT", "/api/v1/deployments/dep-1", bytes.NewReader(mustJSON(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp deployment.Deployment
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Name != "updated-name" {
		t.Errorf("Name = %q, want %q", resp.Name, "updated-name")
	}
}

func TestDeploymentHandler_Delete(t *testing.T) {
	repo := newMockDeploymentRepo()
	repo.data["dep-1"] = createTestDep("dep-1")

	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("DELETE", "/api/v1/deployments/dep-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNoContent)
	}

	if _, ok := repo.data["dep-1"]; ok {
		t.Error("expected deployment to be deleted")
	}
}

func TestDeploymentHandler_Submit(t *testing.T) {
	repo := newMockDeploymentRepo()
	dep := createTestDep("dep-1")
	repo.data["dep-1"] = dep

	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/deployments/dep-1/submit", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp deployment.Deployment
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != deployment.StatusPlanning {
		t.Errorf("Status = %q, want %q", resp.Status, deployment.StatusPlanning)
	}
}

func TestDeploymentHandler_Submit_InvalidTransition(t *testing.T) {
	repo := newMockDeploymentRepo()
	dep := createTestDep("dep-1")
	dep.Status = deployment.StatusApplied
	repo.data["dep-1"] = dep

	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/deployments/dep-1/submit", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestDeploymentHandler_Approve(t *testing.T) {
	repo := newMockDeploymentRepo()
	dep := createTestDep("dep-1")
	dep.Submit()
	dep.PlanComplete("wf-1")
	repo.data["dep-1"] = dep

	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := map[string]string{"approvedBy": "admin"}
	req := httptest.NewRequest("POST", "/api/v1/deployments/dep-1/approve", bytes.NewReader(mustJSON(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp deployment.Deployment
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != deployment.StatusExecuting {
		t.Errorf("Status = %q, want %q", resp.Status, deployment.StatusExecuting)
	}
}

func TestDeploymentHandler_Cancel(t *testing.T) {
	repo := newMockDeploymentRepo()
	dep := createTestDep("dep-1")
	repo.data["dep-1"] = dep

	handler := NewDeploymentHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := map[string]string{"reason": "user request"}
	req := httptest.NewRequest("POST", "/api/v1/deployments/dep-1/cancel", bytes.NewReader(mustJSON(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp deployment.Deployment
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != deployment.StatusCancelled {
		t.Errorf("Status = %q, want %q", resp.Status, deployment.StatusCancelled)
	}
}
