package execution

import "time"

// ExecutionStatus represents the current state of an execution.
type ExecutionStatus string

const (
	ExStatusPending   ExecutionStatus = "PENDING"
	ExStatusRunning   ExecutionStatus = "RUNNING"
	ExStatusCompleted ExecutionStatus = "COMPLETED"
	ExStatusFailed    ExecutionStatus = "FAILED"
	ExStatusCancelled ExecutionStatus = "CANCELLED"
	ExStatusTimeout   ExecutionStatus = "TIMEOUT"
)

// ExecutionPlan is the parsed plan before apply.
type ExecutionPlan struct {
	ResourceChanges []ResourceChange `json:"resourceChanges"`
	Warnings        []string         `json:"warnings,omitempty"`
	EstimatedCost   *CostEstimate    `json:"estimatedCost,omitempty"`
}

// ResourceChange describes a single resource change in a plan.
type ResourceChange struct {
	Address      string            `json:"address"`
	ResourceType string            `json:"resourceType"`
	Action       string            `json:"action"` // create, update, delete, no-op
	Before       map[string]interface{} `json:"before,omitempty"`
	After        map[string]interface{} `json:"after,omitempty"`
	ChangeDetail string            `json:"changeDetail,omitempty"`
}

// ExecutionResult is the outcome of an execution.
type ExecutionResult struct {
	Success   bool              `json:"success"`
	Resources []ResourceResult  `json:"resources"`
	Outputs   map[string]interface{} `json:"outputs,omitempty"`
	Duration  time.Duration     `json:"duration"`
	Error     string            `json:"error,omitempty"`
}

// ResourceResult is the result for a single resource.
type ResourceResult struct {
	Address  string        `json:"address"`
	Action   string        `json:"action"`
	Status   string        `json:"status"`
	Message  string        `json:"message,omitempty"`
	Duration time.Duration `json:"duration"`
}

// CostEstimate provides estimated cost for a plan.
type CostEstimate struct {
	MonthlyLow  float64 `json:"monthlyLow"`
	MonthlyHigh float64 `json:"monthlyHigh"`
	Currency    string  `json:"currency"`
}

// ValidationError describes a validation issue.
type ValidationError struct {
	Resource string `json:"resource"`
	Message  string `json:"message"`
	Severity string `json:"severity"` // error, warning
}
