package rest

import (
	"net/http"

	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
	"github.com/cloudbuilder/provision-engine/internal/domain/execution"
	"github.com/cloudbuilder/provision-engine/internal/domain/workflow"
)

// ExecutionHandler handles execution REST endpoints.
type ExecutionHandler struct {
	repo           execution.Repository
	workflowRepo   workflow.Repository
	deploymentRepo deployment.Repository
}

// NewExecutionHandler creates a new execution handler.
func NewExecutionHandler(
	repo execution.Repository,
	dependencies ...interface{},
) *ExecutionHandler {
	handler := &ExecutionHandler{repo: repo}
	for _, dependency := range dependencies {
		switch typed := dependency.(type) {
		case workflow.Repository:
			handler.workflowRepo = typed
		case deployment.Repository:
			handler.deploymentRepo = typed
		}
	}
	return handler
}

// RegisterRoutes registers execution routes.
func (h *ExecutionHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/executions/{id}", h.Get)
	mux.HandleFunc("GET /api/v1/executions", h.List)
}

func (h *ExecutionHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	exec, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "execution not found")
		return
	}
	if !h.authorizeWorkflow(r, exec.WorkflowID) {
		writeError(w, http.StatusNotFound, "execution not found")
		return
	}
	writeJSON(w, http.StatusOK, exec)
}

func (h *ExecutionHandler) List(w http.ResponseWriter, r *http.Request) {
	workflowID := r.URL.Query().Get("workflow_id")
	if workflowID == "" {
		writeError(w, http.StatusBadRequest, "workflow_id is required")
		return
	}
	if !h.authorizeWorkflow(r, workflowID) {
		writeError(w, http.StatusNotFound, "workflow not found")
		return
	}

	execs, err := h.repo.ListByWorkflowID(r.Context(), workflowID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"executions": execs,
		"total":      len(execs),
	})
}

func (h *ExecutionHandler) authorizeWorkflow(r *http.Request, workflowID string) bool {
	if GetClaims(r) == nil {
		return true
	}
	if h.workflowRepo == nil || h.deploymentRepo == nil {
		return false
	}
	workflowEntity, err := h.workflowRepo.GetByID(r.Context(), workflowID)
	if err != nil {
		return false
	}
	deploymentEntity, err := h.deploymentRepo.GetByID(
		r.Context(),
		workflowEntity.DeploymentID,
	)
	return err == nil && belongsToAuthenticatedTenant(r, deploymentEntity.TenantID)
}
