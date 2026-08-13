package deployment

import (
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// DeploymentStatus represents the current state of a deployment.
type DeploymentStatus string

const (
	StatusPending           DeploymentStatus = "PENDING"
	StatusPlanning          DeploymentStatus = "PLANNING"
	StatusPlanned           DeploymentStatus = "PLANNED"
	StatusAwaitingApproval  DeploymentStatus = "AWAITING_APPROVAL"
	StatusExecuting         DeploymentStatus = "EXECUTING"
	StatusApplied           DeploymentStatus = "APPLIED"
	StatusPartialFailure    DeploymentStatus = "PARTIAL_FAILURE"
	StatusFailed            DeploymentStatus = "FAILED"
	StatusRollingBack       DeploymentStatus = "ROLLING_BACK"
	StatusRolledBack        DeploymentStatus = "ROLLED_BACK"
	StatusCancelled         DeploymentStatus = "CANCELLED"
	StatusDestroying        DeploymentStatus = "DESTROYING"
	StatusDestroyed         DeploymentStatus = "DESTROYED"
	StatusDrifted           DeploymentStatus = "DRIFTED"
)

// ValidTransitions defines allowed state transitions.
var ValidTransitions = map[DeploymentStatus][]DeploymentStatus{
	StatusPending:          {StatusPlanning, StatusCancelled},
	StatusPlanning:         {StatusPlanned, StatusFailed},
	StatusPlanned:          {StatusAwaitingApproval, StatusExecuting, StatusCancelled},
	StatusAwaitingApproval: {StatusExecuting, StatusCancelled},
	StatusExecuting:        {StatusApplied, StatusPartialFailure, StatusFailed, StatusRollingBack},
	StatusPartialFailure:   {StatusExecuting, StatusRollingBack, StatusFailed},
	StatusFailed:           {StatusPlanning, StatusDestroying},
	StatusApplied:          {StatusDrifted, StatusDestroying},
	StatusDrifted:          {StatusExecuting, StatusReconciling},
	StatusRollingBack:      {StatusRolledBack, StatusFailed},
	StatusRolledBack:       {StatusDestroying},
	StatusCancelled:        {StatusDestroying},
	StatusDestroying:       {StatusDestroyed, StatusFailed},
}

// StatusReconciling is a sub-status for drift reconciliation.
const StatusReconciling DeploymentStatus = "RECONCILING"

// CanTransitionTo checks if a transition from current to target is valid.
func (s DeploymentStatus) CanTransitionTo(target DeploymentStatus) bool {
	allowed, ok := ValidTransitions[s]
	if !ok {
		return false
	}
	for _, a := range allowed {
		if a == target {
			return true
		}
	}
	return false
}

// DeploymentConfig holds the configuration for a deployment.
type DeploymentConfig struct {
	ExecutorType string            `json:"executorType"`
	ProviderType string            `json:"providerType"`
	AutoApprove  bool              `json:"autoApprove"`
	Variables    map[string]string `json:"variables,omitempty"`
	WorkDir      string            `json:"workDir,omitempty"`
	Timeout      time.Duration     `json:"timeout"`
	Tags         map[string]string `json:"tags,omitempty"`
}

// Validate checks the deployment configuration for required fields.
func (c DeploymentConfig) Validate() error {
	if c.ExecutorType == "" {
		return shared.ErrValidation("executorType", "is required")
	}
	if c.ProviderType == "" {
		return shared.ErrValidation("providerType", "is required")
	}
	return nil
}

// DeploymentFilter is used for querying deployments.
type DeploymentFilter struct {
	Status []DeploymentStatus
	Limit  int
	Offset int
	SortBy string
	Order  string
}
