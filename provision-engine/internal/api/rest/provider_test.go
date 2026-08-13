package rest

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/provider"
	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// ─── Mock Provider Repository ──────────────────────────────────────────

type mockProviderRepo struct {
	data map[string]*provider.Provider
}

func newMockProviderRepo() *mockProviderRepo {
	return &mockProviderRepo{data: make(map[string]*provider.Provider)}
}

func (m *mockProviderRepo) Create(ctx context.Context, p *provider.Provider) error {
	m.data[p.ID] = p
	return nil
}
func (m *mockProviderRepo) GetByID(ctx context.Context, id string) (*provider.Provider, error) {
	p, ok := m.data[id]
	if !ok {
		return nil, shared.ErrNotFound("Provider", id)
	}
	return p, nil
}
func (m *mockProviderRepo) GetByTypeAndTenant(ctx context.Context, tenantID string, providerType provider.ProviderType) (*provider.Provider, error) {
	for _, p := range m.data {
		if p.TenantID == tenantID && p.Type == providerType {
			return p, nil
		}
	}
	return nil, shared.ErrNotFound("Provider", string(providerType))
}
func (m *mockProviderRepo) Update(ctx context.Context, p *provider.Provider) error {
	m.data[p.ID] = p
	return nil
}
func (m *mockProviderRepo) Delete(ctx context.Context, id string) error {
	delete(m.data, id)
	return nil
}
func (m *mockProviderRepo) ListByTenant(ctx context.Context, tenantID string) ([]*provider.Provider, error) {
	var result []*provider.Provider
	for _, p := range m.data {
		if p.TenantID == tenantID {
			result = append(result, p)
		}
	}
	return result, nil
}

func createTestProvider(id string) *provider.Provider {
	return &provider.Provider{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		TenantID:     "tenant-1",
		Type:         provider.ProviderAWS,
		Name:         "aws-production",
		Status:       provider.ProviderStatusHealthy,
		Config:       map[string]string{"region": "us-east-1"},
		Capabilities: []provider.ProviderCapability{provider.CapProvision, provider.CapDestroy},
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER HANDLER TESTS
// ═══════════════════════════════════════════════════════════════════════════

func TestProviderHandler_List(t *testing.T) {
	repo := newMockProviderRepo()
	repo.data["prov-1"] = createTestProvider("prov-1")

	handler := NewProviderHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/providers?tenant_id=tenant-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["total"].(float64) != 1 {
		t.Errorf("total = %v, want 1", resp["total"])
	}
}

func TestProviderHandler_Create(t *testing.T) {
	repo := newMockProviderRepo()
	handler := NewProviderHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := map[string]interface{}{
		"tenantId": "tenant-1",
		"type":     "aws",
		"name":     "my-aws",
		"config":   map[string]string{"region": "us-west-2"},
	}

	req := httptest.NewRequest("POST", "/api/v1/providers", bytes.NewReader(mustJSON(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusCreated, w.Body.String())
	}

	var resp provider.Provider
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Name != "my-aws" {
		t.Errorf("Name = %q, want %q", resp.Name, "my-aws")
	}
	if resp.Type != provider.ProviderAWS {
		t.Errorf("Type = %q, want %q", resp.Type, provider.ProviderAWS)
	}
}

func TestProviderHandler_Get(t *testing.T) {
	repo := newMockProviderRepo()
	prov := createTestProvider("prov-1")
	repo.data["prov-1"] = prov

	handler := NewProviderHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/providers/prov-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp provider.Provider
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Name != "aws-production" {
		t.Errorf("Name = %q, want %q", resp.Name, "aws-production")
	}
}

func TestProviderHandler_Get_NotFound(t *testing.T) {
	repo := newMockProviderRepo()
	handler := NewProviderHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/providers/nonexistent", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestProviderHandler_Update(t *testing.T) {
	repo := newMockProviderRepo()
	prov := createTestProvider("prov-1")
	repo.data["prov-1"] = prov

	handler := NewProviderHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := map[string]interface{}{
		"name":   "renamed-aws",
		"config": map[string]string{"region": "eu-west-1"},
	}

	req := httptest.NewRequest("PUT", "/api/v1/providers/prov-1", bytes.NewReader(mustJSON(body)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp provider.Provider
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Name != "renamed-aws" {
		t.Errorf("Name = %q, want %q", resp.Name, "renamed-aws")
	}
}

func TestProviderHandler_Delete(t *testing.T) {
	repo := newMockProviderRepo()
	repo.data["prov-1"] = createTestProvider("prov-1")

	handler := NewProviderHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("DELETE", "/api/v1/providers/prov-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNoContent)
	}
}
