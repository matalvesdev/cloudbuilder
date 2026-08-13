package rest

import (
	"encoding/json"
	"net/http"

	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
)

// ResourceHandler handles resource REST endpoints.
type ResourceHandler struct {
	repo resource.Repository
}

// NewResourceHandler creates a new resource handler.
func NewResourceHandler(repo resource.Repository) *ResourceHandler {
	return &ResourceHandler{repo: repo}
}

// RegisterRoutes registers resource routes.
func (h *ResourceHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/resources", h.List)
	mux.HandleFunc("GET /api/v1/resources/{id}", h.Get)
	mux.Handle("DELETE /api/v1/resources/{id}", RequireRole("admin")(http.HandlerFunc(h.Delete)))
	mux.HandleFunc("GET /api/v1/resources/{id}/state", h.GetState)
}

func (h *ResourceHandler) List(w http.ResponseWriter, r *http.Request) {
	deploymentID := r.URL.Query().Get("deployment_id")
	if deploymentID == "" {
		writeError(w, http.StatusBadRequest, "deployment_id is required")
		return
	}

	resources, err := h.repo.ListByDeploymentID(r.Context(), deploymentID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if claims := GetClaims(r); claims != nil {
		resources = filterResourcesByTenant(resources, claims.TenantID)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"resources": resources,
		"total":     len(resources),
	})
}

func (h *ResourceHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	res, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "resource not found")
		return
	}
	if !belongsToAuthenticatedTenant(r, res.TenantID) {
		writeError(w, http.StatusNotFound, "resource not found")
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *ResourceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	res, err := h.repo.GetByID(r.Context(), id)
	if err != nil || !belongsToAuthenticatedTenant(r, res.TenantID) {
		writeError(w, http.StatusNotFound, "resource not found")
		return
	}
	if err := h.repo.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusNotFound, "resource not found")
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}

func (h *ResourceHandler) GetState(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	res, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "resource not found")
		return
	}
	if !belongsToAuthenticatedTenant(r, res.TenantID) {
		writeError(w, http.StatusNotFound, "resource not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"resourceId": res.ID,
		"state":      res.State,
		"config":     res.Config,
	})
}

var _ = json.Marshal
