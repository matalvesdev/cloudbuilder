// Package proto contains gRPC types and generated code for the Provision Engine.
package proto

import (
	"encoding/json"
	"time"
)

// ─── Common Types ───────────────────────────────────────────────────────

type Pagination struct {
	Page       int32  `json:"page"`
	PageSize   int32  `json:"page_size"`
	SortBy     string `json:"sort_by"`
	SortOrder  string `json:"sort_order"`
}

type PaginationResponse struct {
	Page       int32 `json:"page"`
	PageSize   int32 `json:"page_size"`
	TotalCount int32 `json:"total_count"`
	TotalPages int32 `json:"total_pages"`
}

// ─── Deployment Types ──────────────────────────────────────────────────

type DeploymentStatus string

const (
	DeploymentStatusPending           DeploymentStatus = "PENDING"
	DeploymentStatusPlanning          DeploymentStatus = "PLANNING"
	DeploymentStatusPlanned           DeploymentStatus = "PLANNED"
	DeploymentStatusAwaitingApproval  DeploymentStatus = "AWAITING_APPROVAL"
	DeploymentStatusExecuting         DeploymentStatus = "EXECUTING"
	DeploymentStatusApplied           DeploymentStatus = "APPLIED"
	DeploymentStatusPartialFailure    DeploymentStatus = "PARTIAL_FAILURE"
	DeploymentStatusFailed            DeploymentStatus = "FAILED"
	DeploymentStatusRollingBack       DeploymentStatus = "ROLLING_BACK"
	DeploymentStatusRolledBack        DeploymentStatus = "ROLLED_BACK"
	DeploymentStatusCancelled         DeploymentStatus = "CANCELLED"
	DeploymentStatusDestroying        DeploymentStatus = "DESTROYING"
	DeploymentStatusDestroyed         DeploymentStatus = "DESTROYED"
	DeploymentStatusDrifted           DeploymentStatus = "DRIFTED"
)

type DeploymentConfig struct {
	ExecutorType string            `json:"executor_type"`
	ProviderType string            `json:"provider_type"`
	AutoApprove  bool              `json:"auto_approve"`
	Variables    map[string]string `json:"variables"`
	WorkspaceDir string            `json:"workspace_dir"`
	Timeout      int64             `json:"timeout"`
	Tags         map[string]string `json:"tags"`
}

type Deployment struct {
	ID          string            `json:"id"`
	TenantID    string            `json:"tenant_id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Status      DeploymentStatus  `json:"status"`
	Config      *DeploymentConfig `json:"config"`
	WorkflowID  string            `json:"workflow_id"`
	Error       string            `json:"error"`
	Metadata    map[string]string `json:"metadata"`
	Version     int32             `json:"version"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// ─── Request/Response Types ────────────────────────────────────────────

type CreateDeploymentRequest struct {
	TenantID    string            `json:"tenant_id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Config      *DeploymentConfig `json:"config"`
}

type CreateDeploymentResponse struct {
	Deployment *Deployment `json:"deployment"`
}

type GetDeploymentRequest struct {
	ID string `json:"id"`
}

type GetDeploymentResponse struct {
	Deployment *Deployment `json:"deployment"`
}

type ListDeploymentsRequest struct {
	TenantID     string   `json:"tenant_id"`
	StatusFilter []string `json:"status_filter"`
	Pagination   *Pagination `json:"pagination"`
}

type ListDeploymentsResponse struct {
	Deployments []*Deployment      `json:"deployments"`
	Pagination  *PaginationResponse `json:"pagination"`
}

type UpdateDeploymentRequest struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type UpdateDeploymentResponse struct {
	Deployment *Deployment `json:"deployment"`
}

type DeleteDeploymentRequest struct {
	ID     string `json:"id"`
	Reason string `json:"reason"`
}

type SubmitDeploymentRequest struct {
	ID string `json:"id"`
}

type SubmitDeploymentResponse struct {
	Deployment *Deployment `json:"deployment"`
}

type ApproveDeploymentRequest struct {
	ID         string `json:"id"`
	ApprovedBy string `json:"approved_by"`
	Notes      string `json:"notes"`
}

type ApproveDeploymentResponse struct {
	Deployment *Deployment `json:"deployment"`
}

type CancelDeploymentRequest struct {
	ID     string `json:"id"`
	Reason string `json:"reason"`
}

type CancelDeploymentResponse struct {
	Deployment *Deployment `json:"deployment"`
}

type ExecuteDeploymentRequest struct {
	ID     string `json:"id"`
	DryRun bool   `json:"dry_run"`
}

type DestroyDeploymentRequest struct {
	ID     string `json:"id"`
	Reason string `json:"reason"`
	Force  bool   `json:"force"`
}

type RollbackDeploymentRequest struct {
	ID            string `json:"id"`
	TargetVersion int32  `json:"target_version"`
	Reason        string `json:"reason"`
}

type WatchDeploymentRequest struct {
	ID string `json:"id"`
}

type DeploymentEvent struct {
	DeploymentID string `json:"deployment_id"`
	EventType    string `json:"event_type"`
	Status       string `json:"status"`
	Message      string `json:"message"`
	Progress     int32  `json:"progress"`
	Timestamp    string `json:"timestamp"`
}

type DestroyEvent struct {
	DeploymentID string `json:"deployment_id"`
	EventType    string `json:"event_type"`
	Message      string `json:"message"`
}

type RollbackEvent struct {
	DeploymentID string `json:"deployment_id"`
	EventType    string `json:"event_type"`
	Status       string `json:"status"`
	Message      string `json:"message"`
	Version      int32  `json:"version"`
}

// ─── Workflow Types ────────────────────────────────────────────────────

type WorkflowStatus string

const (
	WorkflowStatusPending   WorkflowStatus = "PENDING"
	WorkflowStatusRunning   WorkflowStatus = "RUNNING"
	WorkflowStatusCompleted WorkflowStatus = "COMPLETED"
	WorkflowStatusFailed    WorkflowStatus = "FAILED"
	WorkflowStatusCancelled WorkflowStatus = "CANCELLED"
	WorkflowStatusPaused    WorkflowStatus = "PAUSED"
)

type WorkflowStepStatus string

const (
	StepStatusPending   WorkflowStepStatus = "PENDING"
	StepStatusRunning   WorkflowStepStatus = "RUNNING"
	StepStatusCompleted WorkflowStepStatus = "COMPLETED"
	StepStatusFailed    WorkflowStepStatus = "FAILED"
	StepStatusSkipped   WorkflowStepStatus = "SKIPPED"
	StepStatusRetry     WorkflowStepStatus = "RETRY"
)

type Workflow struct {
	ID           string              `json:"id"`
	DeploymentID string              `json:"deployment_id"`
	Status       WorkflowStatus      `json:"status"`
	Steps        []*WorkflowStep     `json:"steps"`
	CurrentBatch int32               `json:"current_batch"`
	Error        string              `json:"error"`
	CreatedAt    time.Time           `json:"created_at"`
	UpdatedAt    time.Time           `json:"updated_at"`
}

type WorkflowStep struct {
	ID         string              `json:"id"`
	Name       string              `json:"name"`
	Type       string              `json:"type"`
	ResourceID string              `json:"resource_id"`
	Config     map[string]string   `json:"config"`
	DependsOn  []string            `json:"depends_on"`
	Status     WorkflowStepStatus  `json:"status"`
	RetryMax   int32               `json:"retry_max"`
	Timeout    int64               `json:"timeout"`
}

type GetWorkflowRequest struct {
	ID string `json:"id"`
}

type GetWorkflowResponse struct {
	Workflow *Workflow `json:"workflow"`
}

type GetWorkflowByDeploymentRequest struct {
	DeploymentID string `json:"deployment_id"`
}

type ListWorkflowStepsRequest struct {
	WorkflowID   string   `json:"workflow_id"`
	StatusFilter []string `json:"status_filter"`
}

type ListWorkflowStepsResponse struct {
	Steps []*WorkflowStep `json:"steps"`
}

type WatchWorkflowRequest struct {
	WorkflowID string `json:"workflow_id"`
}

type WorkflowEvent struct {
	WorkflowID string `json:"workflow_id"`
	EventType  string `json:"event_type"`
	StepId     string `json:"step_id"`
	Status     string `json:"status"`
	Message    string `json:"message"`
	Timestamp  string `json:"timestamp"`
}

// ─── Execution Types ───────────────────────────────────────────────────

type ExecutionStatus string

const (
	ExecutionStatusPending   ExecutionStatus = "PENDING"
	ExecutionStatusRunning   ExecutionStatus = "RUNNING"
	ExecutionStatusCompleted ExecutionStatus = "COMPLETED"
	ExecutionStatusFailed    ExecutionStatus = "FAILED"
	ExecutionStatusCancelled ExecutionStatus = "CANCELLED"
	ExecutionStatusTimeout   ExecutionStatus = "TIMEOUT"
)

type Execution struct {
	ID           string          `json:"id"`
	WorkflowID   string          `json:"workflow_id"`
	StepId       string          `json:"step_id"`
	ExecutorType string          `json:"executor_type"`
	ProviderType string          `json:"provider_type"`
	Status       ExecutionStatus `json:"status"`
	WorkDir      string          `json:"work_dir"`
	RetryCount   int32           `json:"retry_count"`
	MaxRetries   int32           `json:"max_retries"`
	StartedAt    *time.Time      `json:"started_at"`
	CompletedAt  *time.Time      `json:"completed_at"`
	Error        string          `json:"error"`
	Logs         string          `json:"logs"`
}

type GetExecutionRequest struct {
	ID string `json:"id"`
}

type GetExecutionResponse struct {
	Execution *Execution `json:"execution"`
}

type ListExecutionsRequest struct {
	WorkflowID   string   `json:"workflow_id"`
	StatusFilter []string `json:"status_filter"`
	Pagination   *Pagination `json:"pagination"`
}

type ListExecutionsResponse struct {
	Executions []*Execution        `json:"executions"`
	Pagination *PaginationResponse  `json:"pagination"`
}

type StreamLogsRequest struct {
	ExecutionID string `json:"execution_id"`
	Follow      bool   `json:"follow"`
	TailLines   int32  `json:"tail_lines"`
}

type LogEntry struct {
	Timestamp string            `json:"timestamp"`
	Level     string            `json:"level"`
	Source    string            `json:"source"`
	Message   string            `json:"message"`
	Metadata  map[string]string `json:"metadata"`
}

type WatchExecutionRequest struct {
	ExecutionID string `json:"execution_id"`
}

type ExecutionEvent struct {
	ExecutionID string `json:"execution_id"`
	EventType   string `json:"event_type"`
	Status      string `json:"status"`
	Message     string `json:"message"`
	Progress    int32  `json:"progress"`
	Timestamp   string `json:"timestamp"`
}

// ─── Resource Types ────────────────────────────────────────────────────

type ResourceState string

const (
	ResourceStatePending   ResourceState = "PENDING"
	ResourceStateCreating  ResourceState = "CREATING"
	ResourceStateActive    ResourceState = "ACTIVE"
	ResourceStateUpdating  ResourceState = "UPDATING"
	ResourceStateReplacing ResourceState = "REPLACING"
	ResourceStateDeleting  ResourceState = "DELETING"
	ResourceStateDeleted   ResourceState = "DELETED"
	ResourceStateFailed    ResourceState = "FAILED"
	ResourceStateDrifted   ResourceState = "DRIFTED"
)

type ManagedResource struct {
	ID           string            `json:"id"`
	DeploymentID string            `json:"deployment_id"`
	TenantID     string            `json:"tenant_id"`
	Provider     string            `json:"provider"`
	Type         string            `json:"type"`
	Name         string            `json:"name"`
	Address      string            `json:"address"`
	State        ResourceState     `json:"state"`
	Config       map[string]interface{} `json:"config"`
	Dependencies []string          `json:"dependencies"`
	Metadata     map[string]string `json:"metadata"`
	IsLocked     bool              `json:"is_locked"`
	LockedBy     string            `json:"locked_by"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

type CreateResourceRequest struct {
	DeploymentID string                 `json:"deployment_id"`
	TenantID     string                 `json:"tenant_id"`
	Provider     string                 `json:"provider"`
	Type         string                 `json:"type"`
	Name         string                 `json:"name"`
	Address      string                 `json:"address"`
	Config       map[string]interface{} `json:"config"`
	Dependencies []string               `json:"dependencies"`
}

type CreateResourceResponse struct {
	Resource *ManagedResource `json:"resource"`
}

type GetResourceRequest struct {
	ID string `json:"id"`
}

type GetResourceResponse struct {
	Resource *ManagedResource `json:"resource"`
}

type ListResourcesRequest struct {
	DeploymentID string   `json:"deployment_id"`
	TenantID     string   `json:"tenant_id"`
	StateFilter  []string `json:"state_filter"`
	Pagination   *Pagination `json:"pagination"`
}

type ListResourcesResponse struct {
	Resources []*ManagedResource  `json:"resources"`
	Pagination *PaginationResponse `json:"pagination"`
}

type DeleteResourceRequest struct {
	ID     string `json:"id"`
	Reason string `json:"reason"`
}

type ListByProviderRequest struct {
	TenantID   string      `json:"tenant_id"`
	Provider   string      `json:"provider"`
	Pagination *Pagination `json:"pagination"`
}

type ListDriftedRequest struct {
	TenantID   string      `json:"tenant_id"`
	Pagination *Pagination `json:"pagination"`
}

// ─── State Types ───────────────────────────────────────────────────────

type StateStatus string

const (
	StateStatusSynced   StateStatus = "SYNCED"
	StateStatusDrifted  StateStatus = "DRIFTED"
	StateStatusPending  StateStatus = "PENDING"
	StateStatusConflict StateStatus = "CONFLICT"
)

type StateEntry struct {
	ID           string                 `json:"id"`
	ResourceID   string                 `json:"resource_id"`
	DeploymentID string                 `json:"deployment_id"`
	TenantID     string                 `json:"tenant_id"`
	DesiredState map[string]interface{} `json:"desired_state"`
	CurrentState map[string]interface{} `json:"current_state"`
	Status       StateStatus            `json:"status"`
	Version      int32                  `json:"version"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

type DiffType string

const (
	DiffTypeAdded    DiffType = "ADDED"
	DiffTypeRemoved  DiffType = "REMOVED"
	DiffTypeModified DiffType = "MODIFIED"
	DiffTypeNone     DiffType = "NONE"
)

type StateDiff struct {
	ResourceAddress string                 `json:"resource_address"`
	Type            DiffType               `json:"type"`
	Desired         map[string]interface{} `json:"desired"`
	Current         map[string]interface{} `json:"current"`
	Changes         []PropertyChange       `json:"changes"`
}

type PropertyChange struct {
	Property string `json:"property"`
	Before   string `json:"before"`
	After    string `json:"after"`
}

type StateVersion struct {
	Version    int32                  `json:"version"`
	State      map[string]interface{} `json:"state"`
	Trigger    string                 `json:"trigger"`
	CreatedAt  string                 `json:"created_at"`
}

type GetStateRequest struct {
	ID string `json:"id"`
}

type GetStateResponse struct {
	State *StateEntry `json:"state"`
}

type GetStateByResourceRequest struct {
	ResourceID string `json:"resource_id"`
}

type ComputeDiffRequest struct {
	ResourceID string `json:"resource_id"`
}

type ComputeDiffResponse struct {
	Diffs    []*StateDiff `json:"diffs"`
	HasDrift bool         `json:"has_drift"`
}

type ReconcileStateRequest struct {
	ResourceID string `json:"resource_id"`
}

type ReconcileStateResponse struct {
	State    *StateEntry `json:"state"`
	Applied  bool        `json:"applied"`
}

type ListVersionsRequest struct {
	ResourceID string      `json:"resource_id"`
	Pagination *Pagination `json:"pagination"`
}

type ListVersionsResponse struct {
	Versions  []*StateVersion     `json:"versions"`
	Pagination *PaginationResponse `json:"pagination"`
}

type RestoreVersionRequest struct {
	ResourceID    string `json:"resource_id"`
	TargetVersion int32  `json:"target_version"`
}

type RestoreVersionResponse struct {
	State    *StateEntry `json:"state"`
	Restored bool        `json:"restored"`
}

// ─── Provider Types ────────────────────────────────────────────────────

type ProviderStatus string

const (
	ProviderStatusHealthy   ProviderStatus = "HEALTHY"
	ProviderStatusDegraded  ProviderStatus = "DEGRADED"
	ProviderStatusUnhealthy ProviderStatus = "UNHEALTHY"
	ProviderStatusUnknown   ProviderStatus = "UNKNOWN"
)

type Provider struct {
	ID           string            `json:"id"`
	TenantID     string            `json:"tenant_id"`
	Type         string            `json:"type"`
	Name         string            `json:"name"`
	Status       ProviderStatus    `json:"status"`
	Config       map[string]string `json:"config"`
	Capabilities []string          `json:"capabilities"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

type RegisterProviderRequest struct {
	TenantID     string            `json:"tenant_id"`
	Type         string            `json:"type"`
	Name         string            `json:"name"`
	Config       map[string]string `json:"config"`
	Capabilities []string          `json:"capabilities"`
}

type RegisterProviderResponse struct {
	Provider *Provider `json:"provider"`
}

type GetProviderRequest struct {
	ID string `json:"id"`
}

type GetProviderResponse struct {
	Provider *Provider `json:"provider"`
}

type ListProvidersRequest struct {
	TenantID   string      `json:"tenant_id"`
	Pagination *Pagination `json:"pagination"`
}

type ListProvidersResponse struct {
	Providers []*Provider         `json:"providers"`
	Pagination *PaginationResponse `json:"pagination"`
}

type UpdateProviderRequest struct {
	ID     string            `json:"id"`
	Name   string            `json:"name"`
	Config map[string]string `json:"config"`
}

type UpdateProviderResponse struct {
	Provider *Provider `json:"provider"`
}

type DeleteProviderRequest struct {
	ID string `json:"id"`
}

type ProviderHealthCheckRequest struct {
	ID string `json:"id"`
}

type ProviderHealthCheckResponse struct {
	Healthy   bool   `json:"healthy"`
	Message   string `json:"message"`
	LatencyMs int64  `json:"latency_ms"`
}

// ─── Audit Types ───────────────────────────────────────────────────────

type AuditEvent struct {
	ID           string                 `json:"id"`
	TenantID     string                 `json:"tenant_id"`
	UserID       string                 `json:"user_id"`
	Action       string                 `json:"action"`
	ResourceType string                 `json:"resource_type"`
	ResourceID   string                 `json:"resource_id"`
	Details      map[string]interface{} `json:"details"`
	IPAddress    string                 `json:"ip_address"`
	UserAgent    string                 `json:"user_agent"`
	Timestamp    time.Time              `json:"timestamp"`
}

type ListAuditEventsRequest struct {
	TenantID     string      `json:"tenant_id"`
	Action       string      `json:"action"`
	ResourceType string      `json:"resource_type"`
	Pagination   *Pagination `json:"pagination"`
}

type ListAuditEventsResponse struct {
	Events    []*AuditEvent        `json:"events"`
	Pagination *PaginationResponse  `json:"pagination"`
}

type GetAuditEventRequest struct {
	ID string `json:"id"`
}

type GetAuditEventResponse struct {
	Event *AuditEvent `json:"event"`
}

// ─── Drift Types ───────────────────────────────────────────────────────

type DriftReport struct {
	ResourceID   string       `json:"resource_id"`
	ResourceName string       `json:"resource_name"`
	HasDrift     bool         `json:"has_drift"`
	Diffs        []*StateDiff `json:"diffs"`
	CurrentState string       `json:"current_state"`
}

type DetectDriftRequest struct {
	ResourceID string `json:"resource_id"`
	TenantID   string `json:"tenant_id"`
}

type DetectDriftResponse struct {
	Reports      []*DriftReport `json:"reports"`
	TotalScanned int32          `json:"total_scanned"`
	DriftedCount int32          `json:"drifted_count"`
}

type ReconcileDriftRequest struct {
	ResourceID string `json:"resource_id"`
	AutoApply  bool   `json:"auto_apply"`
}

type ReconcileEvent struct {
	ResourceID string `json:"resource_id"`
	EventType  string `json:"event_type"`
	Status     string `json:"status"`
	Message    string `json:"message"`
	Timestamp  string `json:"timestamp"`
}

type ListDriftedResourcesRequest struct {
	TenantID   string      `json:"tenant_id"`
	Pagination *Pagination `json:"pagination"`
}

type ListDriftedResourcesResponse struct {
	Reports    []*DriftReport      `json:"reports"`
	Pagination *PaginationResponse  `json:"pagination"`
}

// ─── JSON Codec ────────────────────────────────────────────────────────

func MarshalJSON(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}

func UnmarshalJSON(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}
