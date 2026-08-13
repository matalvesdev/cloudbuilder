package rest

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/audit"
	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// ─── Mock Audit Repository ─────────────────────────────────────────────

type mockAuditRepo struct {
	data map[string]*audit.AuditEvent
}

func newMockAuditRepo() *mockAuditRepo {
	return &mockAuditRepo{data: make(map[string]*audit.AuditEvent)}
}

func (m *mockAuditRepo) Create(ctx context.Context, e *audit.AuditEvent) error {
	m.data[e.ID] = e
	return nil
}
func (m *mockAuditRepo) GetByID(ctx context.Context, id string) (*audit.AuditEvent, error) {
	e, ok := m.data[id]
	if !ok {
		return nil, shared.ErrNotFound("AuditEvent", id)
	}
	return e, nil
}
func (m *mockAuditRepo) ListByTenant(ctx context.Context, tenantID string, filter audit.AuditFilter) ([]*audit.AuditEvent, int, error) {
	var result []*audit.AuditEvent
	for _, e := range m.data {
		if e.TenantID == tenantID {
			if filter.Action != "" && e.Action != filter.Action {
				continue
			}
			result = append(result, e)
		}
	}
	return result, len(result), nil
}
func (m *mockAuditRepo) ListByResource(ctx context.Context, resourceType, resourceID string) ([]*audit.AuditEvent, error) {
	return nil, nil
}

func createTestAuditEvent(id string) *audit.AuditEvent {
	return &audit.AuditEvent{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		TenantID:     "tenant-1",
		UserID:       "user-1",
		Action:       "deployment.created",
		ResourceType: "Deployment",
		ResourceID:   "dep-1",
		Details:      map[string]interface{}{"name": "test"},
		IPAddress:    "127.0.0.1",
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT HANDLER TESTS
// ═══════════════════════════════════════════════════════════════════════════

func TestAuditHandler_List(t *testing.T) {
	repo := newMockAuditRepo()
	repo.data["audit-1"] = createTestAuditEvent("audit-1")
	repo.data["audit-2"] = createTestAuditEvent("audit-2")

	handler := NewAuditHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/audit?tenant_id=tenant-1", nil)
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

func TestAuditHandler_List_FilterByAction(t *testing.T) {
	repo := newMockAuditRepo()
	e1 := createTestAuditEvent("audit-1")
	e1.Action = "deployment.created"
	repo.data["audit-1"] = e1

	e2 := createTestAuditEvent("audit-2")
	e2.Action = "deployment.cancelled"
	repo.data["audit-2"] = e2

	handler := NewAuditHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/audit?tenant_id=tenant-1&action=deployment.created", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["total"].(float64) != 1 {
		t.Errorf("total = %v, want 1", resp["total"])
	}
}

func TestAuditHandler_Get(t *testing.T) {
	repo := newMockAuditRepo()
	event := createTestAuditEvent("audit-1")
	repo.data["audit-1"] = event

	handler := NewAuditHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/audit/audit-1", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp audit.AuditEvent
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Action != "deployment.created" {
		t.Errorf("Action = %q, want %q", resp.Action, "deployment.created")
	}
	if resp.UserID != "user-1" {
		t.Errorf("UserID = %q, want %q", resp.UserID, "user-1")
	}
}

func TestAuditHandler_Get_NotFound(t *testing.T) {
	repo := newMockAuditRepo()
	handler := NewAuditHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/audit/nonexistent", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestAuditHandler_List_EmptyTenant(t *testing.T) {
	repo := newMockAuditRepo()
	handler := NewAuditHandler(repo)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/v1/audit", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["total"].(float64) != 0 {
		t.Errorf("total = %v, want 0", resp["total"])
	}
}
