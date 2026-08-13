package rest

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
	"github.com/cloudbuilder/provision-engine/internal/domain/state"
)

// ═══════════════════════════════════════════════════════════════════════════
// DRIFT HANDLER TESTS
// ═══════════════════════════════════════════════════════════════════════════

func TestDriftHandler_Detect(t *testing.T) {
	resRepo := newMockResourceRepo()
	resRepo.data["res-1"] = &resource.ManagedResource{
		TenantID: "tenant-1",
		State:    resource.RStateDrifted,
	}
	resRepo.data["res-2"] = &resource.ManagedResource{
		TenantID: "tenant-1",
		State:    resource.RStateActive,
	}
	stateRepo := newMockStateRepo()

	handler := NewDriftHandler(resRepo, stateRepo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/drift/detect?tenant_id=tenant-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["drifted_count"].(float64) != 1 {
		t.Errorf("drifted_count = %v, want 1", resp["drifted_count"])
	}
}

func TestDriftHandler_ListDrifted(t *testing.T) {
	resRepo := newMockResourceRepo()
	resRepo.data["res-1"] = &resource.ManagedResource{TenantID: "tenant-1", State: resource.RStateDrifted}
	resRepo.data["res-2"] = &resource.ManagedResource{TenantID: "tenant-1", State: resource.RStateDrifted}
	resRepo.data["res-3"] = &resource.ManagedResource{TenantID: "tenant-1", State: resource.RStateActive}
	stateRepo := newMockStateRepo()

	handler := NewDriftHandler(resRepo, stateRepo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/drift/resources?tenant_id=tenant-1", nil)
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

func TestDriftHandler_Reconcile(t *testing.T) {
	resRepo := newMockResourceRepo()
	res := createTestResource("res-1", "dep-1")
	res.State = resource.RStateDrifted
	resRepo.data["res-1"] = res

	stateRepo := newMockStateRepo()
	s := createTestStateEntry("res-1")
	s.CurrentState["cidr"] = "10.0.1.0/24" // drifted
	s.Status = state.Drifted
	stateRepo.data[s.ID] = s

	handler := NewDriftHandler(resRepo, stateRepo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/drift/reconcile?resource_id=res-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["status"] != "reconciled" {
		t.Errorf("status = %v, want reconciled", resp["status"])
	}

	// Verify resource state updated
	updated := resRepo.data["res-1"]
	if updated.State != resource.RStateActive {
		t.Errorf("resource state = %q, want %q", updated.State, resource.RStateActive)
	}

	// Verify state entry reconciled
	updatedState := stateRepo.data[s.ID]
	if updatedState.Status != state.Synced {
		t.Errorf("state status = %q, want %q", updatedState.Status, state.Synced)
	}
}

func TestDriftHandler_Reconcile_MissingResourceID(t *testing.T) {
	resRepo := newMockResourceRepo()
	stateRepo := newMockStateRepo()

	handler := NewDriftHandler(resRepo, stateRepo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/drift/reconcile", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestDriftHandler_Reconcile_ResourceNotFound(t *testing.T) {
	resRepo := newMockResourceRepo()
	stateRepo := newMockStateRepo()

	handler := NewDriftHandler(resRepo, stateRepo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/drift/reconcile?resource_id=nonexistent", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}
