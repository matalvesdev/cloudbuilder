package rest

import (
	"encoding/json"
	"net/http"

	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
)

// DeploymentHandler handles deployment REST endpoints.
type DeploymentHandler struct {
	repo deployment.Repository
}

// NewDeploymentHandler creates a new deployment handler.
func NewDeploymentHandler(repo deployment.Repository) *DeploymentHandler {
	return &DeploymentHandler{repo: repo}
}

// RegisterRoutes registers deployment routes on the given mux.
func (h *DeploymentHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/deployments", h.List)
	mux.Handle("POST /api/v1/deployments", RequireRole("editor")(http.HandlerFunc(h.Create)))
	mux.HandleFunc("GET /api/v1/deployments/{id}", h.Get)
	mux.Handle("PUT /api/v1/deployments/{id}", RequireRole("editor")(http.HandlerFunc(h.Update)))
	mux.Handle("DELETE /api/v1/deployments/{id}", RequireRole("admin")(http.HandlerFunc(h.Delete)))
	mux.Handle("POST /api/v1/deployments/{id}/submit", RequireRole("editor")(http.HandlerFunc(h.Submit)))
	mux.Handle("POST /api/v1/deployments/{id}/approve", RequireRole("admin")(http.HandlerFunc(h.Approve)))
	mux.Handle("POST /api/v1/deployments/{id}/cancel", RequireRole("editor")(http.HandlerFunc(h.Cancel)))
}

func (h *DeploymentHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID, err := resolveTenantID(r, r.URL.Query().Get("tenant_id"))
	if err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	deploys, total, err := h.repo.List(r.Context(), tenantID, deployment.DeploymentFilter{Limit: 50})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"deployments": deploys,
		"total":       total,
	})
}

func (h *DeploymentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TenantID    string                      `json:"tenantId"`
		Name        string                      `json:"name"`
		Description string                      `json:"description"`
		Config      deployment.DeploymentConfig `json:"config"`
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

	svc := deployment.NewService(h.repo)
	dep, err := svc.Create(r.Context(), tenantID, req.Name, req.Description, req.Config)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, dep)
}

func (h *DeploymentHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	dep, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}
	if !belongsToAuthenticatedTenant(r, dep.TenantID) {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}
	writeJSON(w, http.StatusOK, dep)
}

func (h *DeploymentHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	dep, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}
	if !belongsToAuthenticatedTenant(r, dep.TenantID) {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name != "" {
		dep.Name = req.Name
	}
	if req.Description != "" {
		dep.Description = req.Description
	}

	if err := h.repo.Update(r.Context(), dep); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, dep)
}

func (h *DeploymentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	dep, err := h.repo.GetByID(r.Context(), id)
	if err != nil || !belongsToAuthenticatedTenant(r, dep.TenantID) {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}
	if err := h.repo.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}

func (h *DeploymentHandler) Submit(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	dep, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}
	if !belongsToAuthenticatedTenant(r, dep.TenantID) {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}

	if err := dep.Submit(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.repo.Update(r.Context(), dep); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, dep)
}

func (h *DeploymentHandler) Approve(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	dep, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}
	if !belongsToAuthenticatedTenant(r, dep.TenantID) {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}

	approvedBy := "system"
	if claims := GetClaims(r); claims != nil {
		approvedBy = claims.Sub
	}
	if err := dep.Approve(approvedBy); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.repo.Update(r.Context(), dep); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, dep)
}

func (h *DeploymentHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	dep, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}
	if !belongsToAuthenticatedTenant(r, dep.TenantID) {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if err := dep.Cancel(req.Reason); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.repo.Update(r.Context(), dep); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, dep)
}
