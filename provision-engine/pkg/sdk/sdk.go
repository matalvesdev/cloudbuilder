// Package sdk provides the public SDK for building Provision Engine plugins.
package sdk

import "context"

// ExecutorPlugin is the interface that executor plugins must implement.
type ExecutorPlugin interface {
	Name() string
	Version() string
	Init(config map[string]string) error
	Validate(ctx context.Context, workDir string, config map[string]string) error
	Plan(ctx context.Context, workDir string, vars map[string]string) (*PlanResult, error)
	Apply(ctx context.Context, workDir string, planID string) (*ApplyResult, error)
	Destroy(ctx context.Context, workDir string) (*ApplyResult, error)
	Refresh(ctx context.Context, workDir string) (string, error)
	Import(ctx context.Context, workDir string, addr, id string) error
	Outputs(ctx context.Context, workDir string) (map[string]interface{}, error)
	Shutdown() error
}

// ProviderPlugin is the interface that provider plugins must implement.
type ProviderPlugin interface {
	Name() string
	Version() string
	Type() string
	Init(config map[string]string) error
	Authenticate(ctx context.Context, credentials map[string]string) error
	HealthCheck(ctx context.Context) error
	ListResources(ctx context.Context, resourceType string) ([]ResourceInfo, error)
	EstimateCost(ctx context.Context, resourceType string, config map[string]string) (*CostEstimate, error)
	Shutdown() error
}

// HookPlugin is the interface that hook plugins must implement.
type HookPlugin interface {
	Name() string
	Version() string
	HookType() string
	Init(config map[string]string) error
	Execute(ctx context.Context, hookCtx HookContext) (*HookResult, error)
	Shutdown() error
}

// PolicyPlugin is the interface that policy plugins must implement.
type PolicyPlugin interface {
	Name() string
	Version() string
	Init(config map[string]string) error
	Evaluate(ctx context.Context, data map[string]interface{}) (*PolicyResult, error)
	Validate() error
	Shutdown() error
}

// PlanResult holds the output of a plan operation.
type PlanResult struct {
	ResourceChanges []ResourceChange `json:"resourceChanges"`
	Warnings        []string         `json:"warnings,omitempty"`
}

// ResourceChange describes a single resource change.
type ResourceChange struct {
	Address      string `json:"address"`
	ResourceType string `json:"resourceType"`
	Action       string `json:"action"`
}

// ApplyResult holds the output of an apply/destroy operation.
type ApplyResult struct {
	Success   bool             `json:"success"`
	Resources []ResourceResult `json:"resources"`
	Error     string           `json:"error,omitempty"`
}

// ResourceResult holds the result for a single resource.
type ResourceResult struct {
	Address string `json:"address"`
	Action  string `json:"action"`
	Status  string `json:"status"`
}

// ResourceInfo describes a resource.
type ResourceInfo struct {
	ID       string            `json:"id"`
	Type     string            `json:"type"`
	Name     string            `json:"name"`
	Status   string            `json:"status"`
	Region   string            `json:"region,omitempty"`
	Tags     map[string]string `json:"tags,omitempty"`
}

// CostEstimate provides estimated cost.
type CostEstimate struct {
	MonthlyLow  float64 `json:"monthlyLow"`
	MonthlyHigh float64 `json:"monthlyHigh"`
	Currency    string  `json:"currency"`
}

// HookContext provides context to hook implementations.
type HookContext struct {
	DeploymentID string                 `json:"deploymentId"`
	ResourceID   string                 `json:"resourceId,omitempty"`
	ExecutorType string                 `json:"executorType"`
	ProviderType string                 `json:"providerType"`
	Data         map[string]interface{} `json:"data,omitempty"`
}

// HookResult is the outcome of a hook execution.
type HookResult struct {
	Allowed bool              `json:"allowed"`
	Message string            `json:"message,omitempty"`
	Data    map[string]interface{} `json:"data,omitempty"`
}

// PolicyResult is the outcome of policy evaluation.
type PolicyResult struct {
	Allowed    bool              `json:"allowed"`
	Message    string            `json:"message,omitempty"`
	Violations []PolicyViolation `json:"violations,omitempty"`
}

// PolicyViolation describes a policy violation.
type PolicyViolation struct {
	Rule     string `json:"rule"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
}
