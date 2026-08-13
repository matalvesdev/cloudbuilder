package rest

import (
	"net/http"

	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
	"github.com/cloudbuilder/provision-engine/internal/domain/state"
)

// StateHandler handles state REST endpoints.
type StateHandler struct {
	repo         state.Repository
	resourceRepo resource.Repository
}

// NewStateHandler creates a new state handler.
func NewStateHandler(repo state.Repository, resources ...resource.Repository) *StateHandler {
	handler := &StateHandler{repo: repo}
	if len(resources) > 0 {
		handler.resourceRepo = resources[0]
	}
	return handler
}

// RegisterRoutes registers state routes.
func (h *StateHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/state/{resourceId}", h.GetByResource)
	mux.Handle("POST /api/v1/state/{resourceId}/diff", RequireRole("editor")(http.HandlerFunc(h.ComputeDiff)))
	mux.Handle("POST /api/v1/state/{resourceId}/reconcile", RequireRole("editor")(http.HandlerFunc(h.Reconcile)))
	mux.HandleFunc("GET /api/v1/state/{resourceId}/versions", h.ListVersions)
}

func (h *StateHandler) GetByResource(w http.ResponseWriter, r *http.Request) {
	resourceID := r.PathValue("resourceId")
	if !h.authorizeResource(r, resourceID) {
		writeError(w, http.StatusNotFound, "state not found")
		return
	}
	s, err := h.repo.GetByResourceID(r.Context(), resourceID)
	if err != nil {
		writeError(w, http.StatusNotFound, "state not found")
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func (h *StateHandler) ComputeDiff(w http.ResponseWriter, r *http.Request) {
	resourceID := r.PathValue("resourceId")
	if !h.authorizeResource(r, resourceID) {
		writeError(w, http.StatusNotFound, "state not found")
		return
	}
	s, err := h.repo.GetByResourceID(r.Context(), resourceID)
	if err != nil {
		writeError(w, http.StatusNotFound, "state not found")
		return
	}

	diffs := s.ComputeDiff()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"hasDrift": len(diffs) > 0,
		"diffs":    diffs,
	})
}

func (h *StateHandler) Reconcile(w http.ResponseWriter, r *http.Request) {
	resourceID := r.PathValue("resourceId")
	if !h.authorizeResource(r, resourceID) {
		writeError(w, http.StatusNotFound, "state not found")
		return
	}
	s, err := h.repo.GetByResourceID(r.Context(), resourceID)
	if err != nil {
		writeError(w, http.StatusNotFound, "state not found")
		return
	}

	s.Reconcile()
	if err := h.repo.Update(r.Context(), s); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, s)
}

func (h *StateHandler) ListVersions(w http.ResponseWriter, r *http.Request) {
	resourceID := r.PathValue("resourceId")
	if !h.authorizeResource(r, resourceID) {
		writeError(w, http.StatusNotFound, "state not found")
		return
	}
	versions, err := h.repo.ListVersions(r.Context(), resourceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"versions": versions,
		"total":    len(versions),
	})
}

func (h *StateHandler) authorizeResource(r *http.Request, resourceID string) bool {
	if GetClaims(r) == nil {
		return true
	}
	if h.resourceRepo == nil {
		return false
	}
	managedResource, err := h.resourceRepo.GetByID(r.Context(), resourceID)
	return err == nil && belongsToAuthenticatedTenant(r, managedResource.TenantID)
}
