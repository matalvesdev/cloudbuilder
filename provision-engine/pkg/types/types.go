// Package types provides shared types for the Provision Engine public API.
package types

import "time"

// Deployment represents a deployment in the public API.
type Deployment struct {
	ID          string            `json:"id"`
	TenantID    string            `json:"tenantId"`
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	Status      string            `json:"status"`
	Config      DeploymentConfig  `json:"config"`
	WorkflowID  string            `json:"workflowId,omitempty"`
	Error       string            `json:"error,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
	Version     int               `json:"version"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

// DeploymentConfig holds deployment configuration.
type DeploymentConfig struct {
	ExecutorType string            `json:"executorType"`
	ProviderType string            `json:"providerType"`
	AutoApprove  bool              `json:"autoApprove"`
	Variables    map[string]string `json:"variables,omitempty"`
	WorkDir      string            `json:"workDir,omitempty"`
	Timeout      time.Duration     `json:"timeout"`
	Tags         map[string]string `json:"tags,omitempty"`
}

// Workflow represents a workflow in the public API.
type Workflow struct {
	ID           string       `json:"id"`
	DeploymentID string       `json:"deploymentId"`
	Status       string       `json:"status"`
	Steps        []Step       `json:"steps"`
	CurrentBatch int          `json:"currentBatch"`
	Error        string       `json:"error,omitempty"`
	CreatedAt    time.Time    `json:"createdAt"`
	UpdatedAt    time.Time    `json:"updatedAt"`
}

// Step represents a workflow step.
type Step struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Type       string            `json:"type"`
	ResourceID string            `json:"resourceId,omitempty"`
	Config     map[string]string `json:"config,omitempty"`
	DependsOn  []string          `json:"dependsOn,omitempty"`
	Status     string            `json:"status"`
	Result     *StepResult       `json:"result,omitempty"`
}

// StepResult holds step execution result.
type StepResult struct {
	Success  bool          `json:"success"`
	Outputs  map[string]string `json:"outputs,omitempty"`
	Error    string        `json:"error,omitempty"`
	Duration time.Duration `json:"duration"`
}

// Execution represents an execution in the public API.
type Execution struct {
	ID           string     `json:"id"`
	WorkflowID   string     `json:"workflowId"`
	StepID       string     `json:"stepId"`
	ExecutorType string     `json:"executorType"`
	Status       string     `json:"status"`
	StartedAt    *time.Time `json:"startedAt,omitempty"`
	CompletedAt  *time.Time `json:"completedAt,omitempty"`
	Error        string     `json:"error,omitempty"`
}

// ManagedResource represents a managed resource.
type ManagedResource struct {
	ID           string                 `json:"id"`
	DeploymentID string                 `json:"deploymentId"`
	TenantID     string                 `json:"tenantId"`
	Provider     string                 `json:"provider"`
	Type         string                 `json:"type"`
	Name         string                 `json:"name"`
	Address      string                 `json:"address"`
	State        string                 `json:"state"`
	Config       map[string]interface{} `json:"config"`
	Dependencies []string               `json:"dependencies,omitempty"`
	IsLocked     bool                   `json:"isLocked"`
	CreatedAt    time.Time              `json:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt"`
}

// Provider represents a provider configuration.
type Provider struct {
	ID           string   `json:"id"`
	TenantID     string   `json:"tenantId"`
	Type         string   `json:"type"`
	Name         string   `json:"name"`
	Status       string   `json:"status"`
	Capabilities []string `json:"capabilities"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// AuditEvent represents an audit log entry.
type AuditEvent struct {
	ID           string                 `json:"id"`
	TenantID     string                 `json:"tenantId"`
	UserID       string                 `json:"userId"`
	Action       string                 `json:"action"`
	ResourceType string                 `json:"resourceType"`
	ResourceID   string                 `json:"resourceId"`
	Details      map[string]interface{} `json:"details,omitempty"`
	IPAddress    string                 `json:"ipAddress,omitempty"`
	Timestamp    time.Time              `json:"timestamp"`
}

// Pagination represents list pagination.
type Pagination struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	TotalCount int `json:"totalCount"`
	TotalPages int `json:"totalPages"`
}

// ErrorResponse is the standard API error response.
type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}
