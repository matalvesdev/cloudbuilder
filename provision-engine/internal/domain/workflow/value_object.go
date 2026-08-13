package workflow

import (
	"time"
)

// WorkflowStatus represents the current state of a workflow.
type WorkflowStatus string

const (
	WStatusPending    WorkflowStatus = "PENDING"
	WStatusRunning    WorkflowStatus = "RUNNING"
	WStatusCompleted  WorkflowStatus = "COMPLETED"
	WStatusFailed     WorkflowStatus = "FAILED"
	WStatusCancelled  WorkflowStatus = "CANCELLED"
	WStatusPaused     WorkflowStatus = "PAUSED"
)

// StepStatus represents the status of an individual workflow step.
type StepStatus string

const (
	SStatusPending   StepStatus = "PENDING"
	SStatusRunning   StepStatus = "RUNNING"
	SStatusCompleted StepStatus = "COMPLETED"
	SStatusFailed    StepStatus = "FAILED"
	SStatusSkipped   StepStatus = "SKIPPED"
	SStatusRetry     StepStatus = "RETRY"
)

// StepType identifies the kind of step.
type StepType string

const (
	StepTypeCreate    StepType = "create"
	StepTypeUpdate    StepType = "update"
	StepTypeDelete    StepType = "delete"
	StepTypeReplace   StepType = "replace"
	StepTypeDestroy   StepType = "destroy"
	StepTypeImport    StepType = "import"
	StepTypeRefresh   StepType = "refresh"
	StepTypeValidate  StepType = "validate"
	StepTypePlan      StepType = "plan"
	StepTypeApply     StepType = "apply"
	StepTypeRollback  StepType = "rollback"
)

// StepResult holds the outcome of a step execution.
type StepResult struct {
	Success    bool              `json:"success"`
	Outputs    map[string]string `json:"outputs,omitempty"`
	Error      string            `json:"error,omitempty"`
	Duration   time.Duration     `json:"duration"`
	RetryCount int               `json:"retryCount"`
}
