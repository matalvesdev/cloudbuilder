package rest

import (
	"encoding/json"
	"net/http"

	"github.com/cloudbuilder/provision-engine/internal/domain/provider"
)

// ProviderHandler handles provider REST endpoints.
type ProviderHandler struct {
	repo provider.Repository
}

// NewProviderHandler creates a new provider handler.
func NewProviderHandler(repo provider.Repository) *ProviderHandler {
	return &ProviderHandler{repo: repo}
}

// RegisterRoutes registers provider routes.
func (h *ProviderHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/providers", h.List)
	mux.Handle("POST /api/v1/providers", RequireRole("admin")(http.HandlerFunc(h.Create)))
	mux.HandleFunc("GET /api/v1/providers/{id}", h.Get)
	mux.Handle("PUT /api/v1/providers/{id}", RequireRole("admin")(http.HandlerFunc(h.Update)))
	mux.Handle("DELETE /api/v1/providers/{id}", RequireRole("admin")(http.HandlerFunc(h.Delete)))
}

func (h *ProviderHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID, err := resolveTenantID(r, r.URL.Query().Get("tenant_id"))
	if err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	providers, err := h.repo.ListByTenant(r.Context(), tenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"providers": providers,
		"total":     len(providers),
	})
}

func (h *ProviderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TenantID string            `json:"tenantId"`
		Type     string            `json:"type"`
		Name     string            `json:"name"`
		Config   map[string]string `json:"config"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	tenantID, err := resolveTenantID(r, req.TenantID)
	if err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	p := provider.NewProvider(tenantID, provider.ProviderType(req.Type), req.Name, req.Config)
	if err := h.repo.Create(r.Context(), p); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, p)
}

func (h *ProviderHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	p, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "provider not found")
		return
	}
	if !belongsToAuthenticatedTenant(r, p.TenantID) {
		writeError(w, http.StatusNotFound, "provider not found")
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *ProviderHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	p, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "provider not found")
		return
	}
	if !belongsToAuthenticatedTenant(r, p.TenantID) {
		writeError(w, http.StatusNotFound, "provider not found")
		return
	}

	var req struct {
		Name   string            `json:"name"`
		Config map[string]string `json:"config"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if req.Name != "" {
		p.Name = req.Name
	}
	if req.Config != nil {
		p.Config = req.Config
	}

	if err := h.repo.Update(r.Context(), p); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, p)
}

func (h *ProviderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	p, err := h.repo.GetByID(r.Context(), id)
	if err != nil || !belongsToAuthenticatedTenant(r, p.TenantID) {
		writeError(w, http.StatusNotFound, "provider not found")
		return
	}
	if err := h.repo.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusNotFound, "provider not found")
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}
