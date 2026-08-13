package rest

import (
	"net/http"

	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
	"github.com/cloudbuilder/provision-engine/internal/domain/workflow"
)

// WorkflowHandler handles workflow REST endpoints.
type WorkflowHandler struct {
	repo           workflow.Repository
	deploymentRepo deployment.Repository
}

// NewWorkflowHandler creates a new workflow handler.
func NewWorkflowHandler(repo workflow.Repository, deployments ...deployment.Repository) *WorkflowHandler {
	handler := &WorkflowHandler{repo: repo}
	if len(deployments) > 0 {
		handler.deploymentRepo = deployments[0]
	}
	return handler
}

// RegisterRoutes registers workflow routes.
// Route order matters: static segments before wildcards.
func (h *WorkflowHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/workflows/{id}/steps", h.ListSteps)
	mux.HandleFunc("GET /api/v1/workflows/{id}", h.Get)
}

func (h *WorkflowHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	wf, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "workflow not found")
		return
	}
	if !h.authorizeWorkflow(r, wf) {
		writeError(w, http.StatusNotFound, "workflow not found")
		return
	}
	writeJSON(w, http.StatusOK, wf)
}

func (h *WorkflowHandler) ListSteps(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	wf, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "workflow not found")
		return
	}
	if !h.authorizeWorkflow(r, wf) {
		writeError(w, http.StatusNotFound, "workflow not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"workflowId": wf.ID,
		"steps":      wf.Steps,
		"total":      len(wf.Steps),
	})
}

func (h *WorkflowHandler) authorizeWorkflow(r *http.Request, wf *workflow.Workflow) bool {
	if GetClaims(r) == nil {
		return true
	}
	if h.deploymentRepo == nil {
		return false
	}
	deploymentEntity, err := h.deploymentRepo.GetByID(r.Context(), wf.DeploymentID)
	return err == nil && belongsToAuthenticatedTenant(r, deploymentEntity.TenantID)
}
