package plugin

import (
	"context"
	"io"
)

// ExecutorType identifies the IaC tool.
type ExecutorType string

const (
	ExecutorTerraform      ExecutorType = "terraform"
	ExecutorPulumi         ExecutorType = "pulumi"
	ExecutorHelm           ExecutorType = "helm"
	ExecutorDocker         ExecutorType = "docker"
	ExecutorKubernetes     ExecutorType = "kubernetes"
	ExecutorCloudFormation ExecutorType = "cloudformation"
	ExecutorCrossplane     ExecutorType = "crossplane"
	ExecutorAnsible        ExecutorType = "ansible"
	ExecutorScript         ExecutorType = "script"
)

// ExecutionPlan is the parsed plan before apply.
type ExecutionPlan struct {
	ResourceChanges []ResourceChange `json:"resourceChanges"`
	Warnings        []string         `json:"warnings,omitempty"`
	EstimatedCost   *CostEstimate    `json:"estimatedCost,omitempty"`
}

// ResourceChange describes a single resource change.
type ResourceChange struct {
	Address      string                 `json:"address"`
	ResourceType string                 `json:"resourceType"`
	Action       string                 `json:"action"`
	Before       map[string]interface{} `json:"before,omitempty"`
	After        map[string]interface{} `json:"after,omitempty"`
}

// ExecutionResult is the outcome of an execution.
type ExecutionResult struct {
	Success   bool              `json:"success"`
	Resources []ResourceResult  `json:"resources"`
	Outputs   map[string]interface{} `json:"outputs,omitempty"`
	Duration  string            `json:"duration"`
	Error     string            `json:"error,omitempty"`
}

// ResourceResult is the result for a single resource.
type ResourceResult struct {
	Address string `json:"address"`
	Action  string `json:"action"`
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}

// CostEstimate provides estimated cost.
type CostEstimate struct {
	MonthlyLow  float64 `json:"monthlyLow"`
	MonthlyHigh float64 `json:"monthlyHigh"`
	Currency    string  `json:"currency"`
}

// ValidationError describes a validation issue.
type ValidationError struct {
	Resource string `json:"resource"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

// Executor is the interface all IaC executors must implement.
// Each executor wraps a specific IaC tool (Terraform, Pulumi, Helm, etc.)
// and provides a uniform interface for the workflow engine.
type Executor interface {
	Plugin

	// Type returns the executor type identifier.
	Type() ExecutorType

	// Validate validates the configuration without making changes.
	Validate(ctx context.Context, workDir string, config map[string]string) ([]ValidationError, error)

	// Plan generates an execution plan (dry-run).
	Plan(ctx context.Context, workDir string, vars map[string]string) (*ExecutionPlan, error)

	// Apply executes the plan, provisioning real infrastructure.
	Apply(ctx context.Context, workDir string, planID string) (*ExecutionResult, error)

	// Destroy destroys all managed resources.
	Destroy(ctx context.Context, workDir string) (*ExecutionResult, error)

	// Rollback reverts to a previous state.
	Rollback(ctx context.Context, workDir string, snapshotID string) (*ExecutionResult, error)

	// Refresh syncs the current state from the real infrastructure.
	Refresh(ctx context.Context, workDir string) (string, error)

	// Import imports an existing resource into state management.
	Import(ctx context.Context, workDir string, addr, id string) error

	// Diff computes the difference between desired and current state.
	Diff(ctx context.Context, workDir string) (string, error)

	// Outputs returns the output values from the last apply.
	Outputs(ctx context.Context, workDir string) (map[string]interface{}, error)

	// Status returns the current status of the executor.
	Status(ctx context.Context, workDir string) (string, error)

	// Logs returns a reader for the executor's logs.
	Logs(ctx context.Context, workDir string, follow bool) (io.Reader, error)

	// Version returns the executor version.
	Version(ctx context.Context) (string, error)

	// InitWorkspace initializes the executor workspace (e.g., terraform init).
	InitWorkspace(ctx context.Context, workDir string) error

	// WorkspaceCreate creates a new workspace.
	WorkspaceCreate(ctx context.Context, workDir, name string) error

	// WorkspaceSelect selects a workspace.
	WorkspaceSelect(ctx context.Context, workDir, name string) error

	// WorkspaceDelete deletes a workspace.
	WorkspaceDelete(ctx context.Context, workDir, name string) error
}
