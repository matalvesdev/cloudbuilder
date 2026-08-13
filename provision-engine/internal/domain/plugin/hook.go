package plugin

import "context"

// HookType determines when the hook fires.
type HookType string

const (
	HookPrePlan     HookType = "pre_plan"
	HookPostPlan    HookType = "post_plan"
	HookPreApply    HookType = "pre_apply"
	HookPostApply   HookType = "post_apply"
	HookPreDestroy  HookType = "pre_destroy"
	HookPostDestroy HookType = "post_destroy"
	HookOnError     HookType = "on_error"
	HookOnRollback  HookType = "on_rollback"
)

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

// Hook is the interface for lifecycle hooks.
// Hooks fire at specific points in the deployment lifecycle.
type Hook interface {
	Plugin

	// Type returns when this hook fires.
	Type() HookType

	// Execute runs the hook.
	Execute(ctx context.Context, hookCtx HookContext) (*HookResult, error)
}
