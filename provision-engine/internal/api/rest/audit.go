package rest

import (
	"net/http"
	"strconv"

	"github.com/cloudbuilder/provision-engine/internal/domain/audit"
)

// AuditHandler handles audit REST endpoints.
type AuditHandler struct {
	repo audit.Repository
}

// NewAuditHandler creates a new audit handler.
func NewAuditHandler(repo audit.Repository) *AuditHandler {
	return &AuditHandler{repo: repo}
}

// RegisterRoutes registers audit routes.
func (h *AuditHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/audit", h.List)
	mux.HandleFunc("GET /api/v1/audit/{id}", h.Get)
}

func (h *AuditHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID, err := resolveTenantID(r, r.URL.Query().Get("tenant_id"))
	if err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	filter := audit.AuditFilter{
		Action:       r.URL.Query().Get("action"),
		ResourceType: r.URL.Query().Get("resource_type"),
	}

	if limit := r.URL.Query().Get("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil {
			filter.Limit = l
		}
	}
	if offset := r.URL.Query().Get("offset"); offset != "" {
		if o, err := strconv.Atoi(offset); err == nil {
			filter.Offset = o
		}
	}

	events, total, err := h.repo.ListByTenant(r.Context(), tenantID, filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"events": events,
		"total":  total,
	})
}

func (h *AuditHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	event, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "audit event not found")
		return
	}
	writeJSON(w, http.StatusOK, event)
}
