package rest

import (
	"net/http"

	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
	"github.com/cloudbuilder/provision-engine/internal/domain/state"
)

// DriftHandler handles drift detection REST endpoints.
type DriftHandler struct {
	resourceRepo resource.Repository
	stateRepo    state.Repository
}

// NewDriftHandler creates a new drift handler.
func NewDriftHandler(resourceRepo resource.Repository, stateRepo state.Repository) *DriftHandler {
	return &DriftHandler{resourceRepo: resourceRepo, stateRepo: stateRepo}
}

// RegisterRoutes registers drift routes.
func (h *DriftHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/drift/detect", h.Detect)
	mux.HandleFunc("GET /api/v1/drift/resources", h.ListDrifted)
	mux.HandleFunc("POST /api/v1/drift/reconcile", h.Reconcile)
}

func (h *DriftHandler) Detect(w http.ResponseWriter, r *http.Request) {
	tenantID, err := resolveTenantID(r, r.URL.Query().Get("tenant_id"))
	if err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	resources, err := h.resourceRepo.ListByState(r.Context(), resource.RStateDrifted)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resources = filterResourcesByTenant(resources, tenantID)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"total_scanned": len(resources),
		"drifted_count": len(resources),
		"resources":     resources,
	})
}

func (h *DriftHandler) ListDrifted(w http.ResponseWriter, r *http.Request) {
	tenantID, err := resolveTenantID(r, r.URL.Query().Get("tenant_id"))
	if err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	resources, err := h.resourceRepo.ListByState(r.Context(), resource.RStateDrifted)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resources = filterResourcesByTenant(resources, tenantID)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"resources": resources,
		"total":     len(resources),
	})
}

func (h *DriftHandler) Reconcile(w http.ResponseWriter, r *http.Request) {
	resourceID := parseQueryString(r, "resource_id", "")
	if resourceID == "" {
		writeError(w, http.StatusBadRequest, "resource_id is required")
		return
	}

	res, err := h.resourceRepo.GetByID(r.Context(), resourceID)
	if err != nil || !belongsToAuthenticatedTenant(r, res.TenantID) {
		writeError(w, http.StatusNotFound, "resource not found")
		return
	}

	stateEntry, err := h.stateRepo.GetByResourceID(r.Context(), resourceID)
	if err != nil {
		writeError(w, http.StatusNotFound, "state not found for resource")
		return
	}

	stateEntry.Reconcile()
	if err := h.stateRepo.Update(r.Context(), stateEntry); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Update resource state
	res.UpdateState(resource.RStateActive)
	_ = h.resourceRepo.Update(r.Context(), res)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"resource_id": resourceID,
		"status":      "reconciled",
	})
}

func filterResourcesByTenant(
	resources []*resource.ManagedResource,
	tenantID string,
) []*resource.ManagedResource {
	filtered := make([]*resource.ManagedResource, 0, len(resources))
	for _, managedResource := range resources {
		if managedResource.TenantID == tenantID {
			filtered = append(filtered, managedResource)
		}
	}
	return filtered
}
