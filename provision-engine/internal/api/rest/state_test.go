package rest

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
	"github.com/cloudbuilder/provision-engine/internal/domain/state"
)

// ─── Mock State Repository ─────────────────────────────────────────────

type mockStateRepo struct {
	data map[string]*state.StateEntry
}

func newMockStateRepo() *mockStateRepo {
	return &mockStateRepo{data: make(map[string]*state.StateEntry)}
}

func (m *mockStateRepo) Create(ctx context.Context, s *state.StateEntry) error {
	m.data[s.ID] = s
	return nil
}
func (m *mockStateRepo) GetByID(ctx context.Context, id string) (*state.StateEntry, error) {
	s, ok := m.data[id]
	if !ok {
		return nil, shared.ErrNotFound("State", id)
	}
	return s, nil
}
func (m *mockStateRepo) GetByResourceID(ctx context.Context, resourceID string) (*state.StateEntry, error) {
	for _, s := range m.data {
		if s.ResourceID == resourceID {
			return s, nil
		}
	}
	return nil, shared.ErrNotFound("State", resourceID)
}
func (m *mockStateRepo) Update(ctx context.Context, s *state.StateEntry) error {
	m.data[s.ID] = s
	return nil
}
func (m *mockStateRepo) GetVersion(ctx context.Context, resourceID string, version int) (*state.StateEntry, error) {
	return nil, nil
}
func (m *mockStateRepo) ListVersions(ctx context.Context, resourceID string) ([]state.StateVersion, error) {
	return []state.StateVersion{
		{Version: 2, State: map[string]interface{}{"cidr": "10.0.0.0/16"}, Trigger: "synced", CreatedAt: time.Now().Format(time.RFC3339)},
		{Version: 1, State: map[string]interface{}{"cidr": "10.0.0.0/16"}, Trigger: "create", CreatedAt: time.Now().Format(time.RFC3339)},
	}, nil
}
func (m *mockStateRepo) ListByStatus(ctx context.Context, status state.StateStatus) ([]*state.StateEntry, error) {
	return nil, nil
}

func createTestStateEntry(resourceID string) *state.StateEntry {
	return &state.StateEntry{
		AggregateRoot: shared.AggregateRoot{
			ID:        "state-" + resourceID,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		ResourceID:   resourceID,
		DeploymentID: "dep-1",
		TenantID:     "tenant-1",
		DesiredState: map[string]interface{}{"cidr": "10.0.0.0/16", "name": "main-vpc"},
		CurrentState: map[string]interface{}{"cidr": "10.0.0.0/16", "name": "main-vpc"},
		Status:       state.Synced,
		Version:      1,
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE HANDLER TESTS
// ═══════════════════════════════════════════════════════════════════════════

func TestStateHandler_GetByResource(t *testing.T) {
	repo := newMockStateRepo()
	s := createTestStateEntry("res-1")
	repo.data[s.ID] = s

	handler := NewStateHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/state/res-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp state.StateEntry
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.ResourceID != "res-1" {
		t.Errorf("ResourceID = %q, want %q", resp.ResourceID, "res-1")
	}
}

func TestStateHandler_GetByResource_NotFound(t *testing.T) {
	repo := newMockStateRepo()
	handler := NewStateHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/state/nonexistent", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestStateHandler_ComputeDiff_NoDrift(t *testing.T) {
	repo := newMockStateRepo()
	s := createTestStateEntry("res-1")
	repo.data[s.ID] = s

	handler := NewStateHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/state/res-1/diff", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["hasDrift"] != false {
		t.Errorf("hasDrift = %v, want false", resp["hasDrift"])
	}
}

func TestStateHandler_ComputeDiff_WithDrift(t *testing.T) {
	repo := newMockStateRepo()
	s := createTestStateEntry("res-1")
	s.CurrentState = map[string]interface{}{"cidr": "10.0.1.0/24", "name": "main-vpc"} // cidr changed
	repo.data[s.ID] = s

	handler := NewStateHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/state/res-1/diff", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["hasDrift"] != true {
		t.Errorf("hasDrift = %v, want true", resp["hasDrift"])
	}
}

func TestStateHandler_Reconcile(t *testing.T) {
	repo := newMockStateRepo()
	s := createTestStateEntry("res-1")
	s.CurrentState = map[string]interface{}{"cidr": "10.0.1.0/24"} // drifted
	s.Status = state.Drifted
	repo.data[s.ID] = s

	handler := NewStateHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/state/res-1/reconcile", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp state.StateEntry
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != state.Synced {
		t.Errorf("Status = %q, want %q", resp.Status, state.Synced)
	}
	// After reconcile, current should match desired
	if resp.CurrentState["cidr"] != "10.0.0.0/16" {
		t.Errorf("CurrentState[cidr] = %v, want 10.0.0.0/16", resp.CurrentState["cidr"])
	}
}

func TestStateHandler_ListVersions(t *testing.T) {
	repo := newMockStateRepo()
	s := createTestStateEntry("res-1")
	repo.data[s.ID] = s

	handler := NewStateHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/state/res-1/versions", nil)
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
