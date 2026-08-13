package rest

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// ─── Mock Resource Repository ──────────────────────────────────────────

type mockResourceRepo struct {
	data    map[string]*resource.ManagedResource
	listErr error
}

func newMockResourceRepo() *mockResourceRepo {
	return &mockResourceRepo{data: make(map[string]*resource.ManagedResource)}
}

func (m *mockResourceRepo) Create(ctx context.Context, r *resource.ManagedResource) error {
	m.data[r.ID] = r
	return nil
}
func (m *mockResourceRepo) GetByID(ctx context.Context, id string) (*resource.ManagedResource, error) {
	r, ok := m.data[id]
	if !ok {
		return nil, shared.ErrNotFound("Resource", id)
	}
	return r, nil
}
func (m *mockResourceRepo) GetByAddress(ctx context.Context, addr string) (*resource.ManagedResource, error) {
	for _, r := range m.data {
		if r.Address == addr {
			return r, nil
		}
	}
	return nil, shared.ErrNotFound("Resource", addr)
}
func (m *mockResourceRepo) Update(ctx context.Context, r *resource.ManagedResource) error {
	m.data[r.ID] = r
	return nil
}
func (m *mockResourceRepo) Delete(ctx context.Context, id string) error {
	delete(m.data, id)
	return nil
}
func (m *mockResourceRepo) ListByDeploymentID(ctx context.Context, depID string) ([]*resource.ManagedResource, error) {
	if m.listErr != nil {
		return nil, m.listErr
	}
	var result []*resource.ManagedResource
	for _, r := range m.data {
		if r.DeploymentID == depID {
			result = append(result, r)
		}
	}
	return result, nil
}
func (m *mockResourceRepo) ListByProvider(ctx context.Context, tenantID, provider string) ([]*resource.ManagedResource, error) {
	return nil, nil
}
func (m *mockResourceRepo) ListByState(ctx context.Context, state resource.ResourceState) ([]*resource.ManagedResource, error) {
	var result []*resource.ManagedResource
	for _, r := range m.data {
		if r.State == state {
			result = append(result, r)
		}
	}
	return result, nil
}
func (m *mockResourceRepo) CountByTenant(ctx context.Context, tenantID string) (int, error) {
	return 0, nil
}

func createTestResource(id, depID string) *resource.ManagedResource {
	return &resource.ManagedResource{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		DeploymentID: depID,
		TenantID:     "tenant-1",
		Provider:     "aws",
		Type:         "aws_vpc",
		Name:         "main-vpc",
		Address:      "aws_vpc.main",
		State:        resource.RStateActive,
		Config:       map[string]interface{}{"cidr": "10.0.0.0/16"},
		Dependencies: []string{},
		Metadata:     make(map[string]string),
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// RESOURCE HANDLER TESTS
// ═══════════════════════════════════════════════════════════════════════════

func TestResourceHandler_List(t *testing.T) {
	repo := newMockResourceRepo()
	repo.data["res-1"] = createTestResource("res-1", "dep-1")
	repo.data["res-2"] = createTestResource("res-2", "dep-1")

	handler := NewResourceHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/resources?deployment_id=dep-1", nil)
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

func TestResourceHandler_List_MissingDeploymentID(t *testing.T) {
	repo := newMockResourceRepo()
	handler := NewResourceHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/resources", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestResourceHandler_Get(t *testing.T) {
	repo := newMockResourceRepo()
	res := createTestResource("res-1", "dep-1")
	repo.data["res-1"] = res

	handler := NewResourceHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/resources/res-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp resource.ManagedResource
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Name != "main-vpc" {
		t.Errorf("Name = %q, want %q", resp.Name, "main-vpc")
	}
}

func TestResourceHandler_Get_NotFound(t *testing.T) {
	repo := newMockResourceRepo()
	handler := NewResourceHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/resources/nonexistent", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestResourceHandler_Delete(t *testing.T) {
	repo := newMockResourceRepo()
	repo.data["res-1"] = createTestResource("res-1", "dep-1")

	handler := NewResourceHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("DELETE", "/api/v1/resources/res-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNoContent)
	}
}

func TestResourceHandler_GetState(t *testing.T) {
	repo := newMockResourceRepo()
	res := createTestResource("res-1", "dep-1")
	repo.data["res-1"] = res

	handler := NewResourceHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/resources/res-1/state", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["resourceId"] != "res-1" {
		t.Errorf("resourceId = %v, want res-1", resp["resourceId"])
	}
	if resp["state"] != string(resource.RStateActive) {
		t.Errorf("state = %v, want ACTIVE", resp["state"])
	}
}
