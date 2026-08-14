package rest

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/executor"
	"github.com/rs/zerolog/log"
)

// ProvisionHandler handles Terraform provisioning requests from the Java backend.
// Flow: receive files → write to temp dir → set env vars → init → plan → apply
type ProvisionHandler struct {
	// WorkDir is the base directory for Terraform working directories
	WorkDir string
}

// NewProvisionHandler creates a new provision handler.
func NewProvisionHandler(workDir string) *ProvisionHandler {
	if workDir == "" {
		workDir = "/tmp/cloudbuilder-provision"
	}
	return &ProvisionHandler{WorkDir: workDir}
}

// RegisterRoutes registers provision routes on the given mux.
func (h *ProvisionHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/v1/provision/apply", h.Apply)
	mux.HandleFunc("POST /api/v1/provision/plan", h.Plan)
	mux.HandleFunc("POST /api/v1/provision/validate", h.Validate)
	mux.HandleFunc("POST /api/v1/provision/destroy", h.Destroy)
}

// ProvisionRequest is the payload sent by the Java backend.
type ProvisionRequest struct {
	CanvasID     string            `json:"canvasId"`
	TenantID     string            `json:"tenantId"`
	Provider     string            `json:"provider"`
	Engine       string            `json:"engine"`
	Files        map[string]string `json:"files"`
	ResourceCount int             `json:"resourceCount"`
	EnvVars      map[string]string `json:"envVars"`
	AutoApprove  bool              `json:"autoApprove"`
	CredentialID string            `json:"credentialId"`
}

// ProvisionResponse is returned after provisioning.
type ProvisionResponse struct {
	DeploymentID string `json:"deploymentId"`
	Status       string `json:"status"`
	Message      string `json:"message"`
	PlanOutput   string `json:"planOutput,omitempty"`
	ApplyOutput  string `json:"applyOutput,omitempty"`
	Error        string `json:"error,omitempty"`
	DurationMs   int64  `json:"durationMs"`
}

// Apply receives Terraform files + credentials, writes them to disk, and runs
// terraform init → plan → apply. This is the core provisioning endpoint.
func (h *ProvisionHandler) Apply(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req ProvisionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if err := validateProvisionRequest(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Resolve engine type
	engineType := executor.Terraform
	if req.Engine == "opentofu" {
		engineType = executor.OpenTofu
	}

	// Create working directory for this deployment
	workDir, err := os.MkdirTemp(h.WorkDir, fmt.Sprintf("cb-%s-*", req.TenantID[:8]))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create work directory: "+err.Error())
		return
	}
	defer os.RemoveAll(workDir) // cleanup after execution

	log.Info().
		Str("canvasId", req.CanvasID).
		Str("tenantId", req.TenantID).
		Str("provider", req.Provider).
		Str("engine", string(engineType)).
		Str("workDir", workDir).
		Int("files", len(req.Files)).
		Msg("provision apply started")

	// 1. Write Terraform files to disk
	exec := executor.NewExecutor(engineType, workDir)
	dm := executor.NewDeploymentManager(exec)

	if err := dm.WriteCode(req.Files); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to write terraform files: "+err.Error())
		return
	}

	// 2. Set up environment variables (credentials + provider config)
	envVars := buildEnvVars(req.EnvVars)
	exec.SetEnv(envVars)

	// 3. Execute terraform init → plan
	statusChan := make(chan executor.DeploymentStatus, 10)
	errChan := make(chan error, 1)

	go func() {
		errChan <- dm.Execute(context.Background(), statusChan)
	}()

	// Collect status updates
	var planOutput string
	var lastStatus executor.DeploymentStatus
	for {
		select {
		case status := <-statusChan:
			lastStatus = status
			log.Info().Str("status", status.String()).Msg("provision status update")
		case err := <-errChan:
			if err != nil {
				applyErr := dm.Apply(context.Background(), statusChan)
				if applyErr != nil {
					resp := ProvisionResponse{
						Status:     "FAILED",
						Error:      applyErr.Error(),
						DurationMs: time.Since(start).Milliseconds(),
					}
					writeJSON(w, http.StatusInternalServerError, resp)
					return
				}

				// Collect remaining status updates
				for s := range statusChan {
					lastStatus = s
				}

				resp := ProvisionResponse{
					Status:     "APPLIED",
					Message:    "Terraform applied successfully",
					DurationMs: time.Since(start).Milliseconds(),
				}
				writeJSON(w, http.StatusOK, resp)
				return
			}

			// Plan succeeded - collect remaining status
			for s := range statusChan {
				lastStatus = s
			}
			_ = lastStatus
			_ = planOutput

			// Auto-approve: proceed to apply
			if req.AutoApprove {
				applyErr := dm.Apply(context.Background(), statusChan)
				if applyErr != nil {
					resp := ProvisionResponse{
						Status:     "FAILED",
						Error:      applyErr.Error(),
						DurationMs: time.Since(start).Milliseconds(),
					}
					writeJSON(w, http.StatusInternalServerError, resp)
					return
				}

				for s := range statusChan {
					lastStatus = s
				}

				resp := ProvisionResponse{
					Status:     "APPLIED",
					Message:    "Terraform applied successfully (auto-approve)",
					DurationMs: time.Since(start).Milliseconds(),
				}
				writeJSON(w, http.StatusOK, resp)
				return
			}

			// Plan-only: return plan result
			resp := ProvisionResponse{
				Status:     "PLANNED",
				Message:    "Terraform plan completed. Use /apply to execute.",
				PlanOutput: planOutput,
				DurationMs: time.Since(start).Milliseconds(),
			}
			writeJSON(w, http.StatusOK, resp)
			return
		}
	}
}

// Plan runs terraform init + plan only (no apply).
func (h *ProvisionHandler) Plan(w http.ResponseWriter, r *http.Request) {
	h.provisionStep(w, r, false)
}

// Validate runs terraform init + validate only.
func (h *ProvisionHandler) Validate(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req ProvisionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if err := validateProvisionRequest(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	engineType := executor.Terraform
	if req.Engine == "opentofu" {
		engineType = executor.OpenTofu
	}

	workDir, err := os.MkdirTemp(h.WorkDir, fmt.Sprintf("cb-validate-%s-*", req.TenantID[:8]))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create work directory: "+err.Error())
		return
	}
	defer os.RemoveAll(workDir)

	exec := executor.NewExecutor(engineType, workDir)
	dm := executor.NewDeploymentManager(exec)

	if err := dm.WriteCode(req.Files); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to write files: "+err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Init
	initResult, err := exec.Init(ctx)
	if err != nil {
		writeJSON(w, http.StatusOK, ProvisionResponse{
			Status:     "INVALID",
			Error:      fmt.Sprintf("init failed: %s\n%s", err.Error(), initResult.Stderr),
			DurationMs: time.Since(start).Milliseconds(),
		})
		return
	}

	// Validate
	validateResult, err := exec.Validate(ctx)
	if err != nil {
		writeJSON(w, http.StatusOK, ProvisionResponse{
			Status:     "INVALID",
			Error:      fmt.Sprintf("validation failed: %s\n%s", err.Error(), validateResult.Stderr),
			DurationMs: time.Since(start).Milliseconds(),
		})
		return
	}

	writeJSON(w, http.StatusOK, ProvisionResponse{
		Status:     "VALID",
		Message:    "Terraform configuration is valid",
		PlanOutput: validateResult.Stdout,
		DurationMs: time.Since(start).Milliseconds(),
	})
}

// Destroy runs terraform destroy to tear down infrastructure.
func (h *ProvisionHandler) Destroy(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req ProvisionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if err := validateProvisionRequest(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	engineType := executor.Terraform
	if req.Engine == "opentofu" {
		engineType = executor.OpenTofu
	}

	workDir, err := os.MkdirTemp(h.WorkDir, fmt.Sprintf("cb-destroy-%s-*", req.TenantID[:8]))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create work directory: "+err.Error())
		return
	}
	defer os.RemoveAll(workDir)

	exec := executor.NewExecutor(engineType, workDir)
	dm := executor.NewDeploymentManager(exec)

	if err := dm.WriteCode(req.Files); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to write files: "+err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// Init first
	if _, err := exec.Init(ctx); err != nil {
		writeJSON(w, http.StatusOK, ProvisionResponse{
			Status:     "FAILED",
			Error:      "init failed: " + err.Error(),
			DurationMs: time.Since(start).Milliseconds(),
		})
		return
	}

	// Destroy
	statusChan := make(chan executor.DeploymentStatus, 10)
	go func() {
		_ = dm.Destroy(ctx, statusChan)
		close(statusChan)
	}()

	var lastStatus executor.DeploymentStatus
	for s := range statusChan {
		lastStatus = s
	}

	destroyResult, _ := exec.Output(ctx)

	writeJSON(w, http.StatusOK, ProvisionResponse{
		Status:     "DESTROYED",
		Message:    fmt.Sprintf("Destroy completed: %s", lastStatus.String()),
		ApplyOutput: destroyResult.Stdout,
		DurationMs: time.Since(start).Milliseconds(),
	})
}

// provisionStep is the shared implementation for plan-only operations.
func (h *ProvisionHandler) provisionStep(w http.ResponseWriter, r *http.Request, apply bool) {
	start := time.Now()

	var req ProvisionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if err := validateProvisionRequest(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	engineType := executor.Terraform
	if req.Engine == "opentofu" {
		engineType = executor.OpenTofu
	}

	workDir, err := os.MkdirTemp(h.WorkDir, fmt.Sprintf("cb-plan-%s-*", req.TenantID[:8]))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create work directory: "+err.Error())
		return
	}
	defer os.RemoveAll(workDir)

	exec := executor.NewExecutor(engineType, workDir)
	dm := executor.NewDeploymentManager(exec)

	if err := dm.WriteCode(req.Files); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to write files: "+err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// Run plan
	statusChan := make(chan executor.DeploymentStatus, 10)
	errChan := make(chan error, 1)

	go func() {
		errChan <- dm.Execute(ctx, statusChan)
	}()

	var planOutput string
	for s := range statusChan {
		_ = s
	}

	if err := <-errChan; err != nil {
		writeJSON(w, http.StatusOK, ProvisionResponse{
			Status:     "PLAN_FAILED",
			Error:      err.Error(),
			DurationMs: time.Since(start).Milliseconds(),
		})
		return
	}

	// Read plan output
	planResult, _ := exec.Output(ctx)
	planOutput = planResult.Stdout

	if !apply {
		writeJSON(w, http.StatusOK, ProvisionResponse{
			Status:     "PLANNED",
			Message:    "Plan completed",
			PlanOutput: planOutput,
			DurationMs: time.Since(start).Milliseconds(),
		})
		return
	}

	// Apply
	applyErr := dm.Apply(ctx, statusChan)
	if applyErr != nil {
		writeJSON(w, http.StatusOK, ProvisionResponse{
			Status:     "APPLY_FAILED",
			Error:      applyErr.Error(),
			DurationMs: time.Since(start).Milliseconds(),
		})
		return
	}

	outputResult, _ := exec.Output(ctx)

	writeJSON(w, http.StatusOK, ProvisionResponse{
		Status:      "APPLIED",
		Message:     "Apply completed",
		ApplyOutput: outputResult.Stdout,
		DurationMs:  time.Since(start).Milliseconds(),
	})
}

// validateProvisionRequest checks required fields.
func validateProvisionRequest(req *ProvisionRequest) error {
	if req.CanvasID == "" {
		return fmt.Errorf("canvasId is required")
	}
	if req.TenantID == "" {
		return fmt.Errorf("tenantId is required")
	}
	if req.Provider == "" {
		return fmt.Errorf("provider is required")
	}
	if len(req.Files) == 0 {
		return fmt.Errorf("files cannot be empty — generate Terraform code first")
	}
	// Verify main.tf exists
	if _, ok := req.Files["main.tf"]; !ok {
		return fmt.Errorf("main.tf is required in files")
	}
	return nil
}

// buildEnvVars constructs environment variables from the credential map.
func buildEnvVars(envVars map[string]string) []string {
	var result []string
	for k, v := range envVars {
		result = append(result, k+"="+v)
	}
	return result
}

// ensureDir creates a directory if it doesn't exist.
func ensureDir(path string) error {
	dir := filepath.Dir(path)
	return os.MkdirAll(dir, 0755)
}
