package deployment

import (
	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// Deployment is the aggregate root for infrastructure deployments.
// It coordinates the entire lifecycle from planning to execution to completion.
type Deployment struct {
	shared.AggregateRoot
	TenantID    string            `json:"tenantId"`
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	Status      DeploymentStatus  `json:"status"`
	Config      DeploymentConfig  `json:"config"`
	WorkflowID  string            `json:"workflowId,omitempty"`
	Error       string            `json:"error,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// NewDeployment creates a new deployment with PENDING status.
func NewDeployment(tenantID, name, description string, config DeploymentConfig) (*Deployment, error) {
	if err := config.Validate(); err != nil {
		return nil, err
	}

	d := &Deployment{
		AggregateRoot: shared.NewAggregateRoot(),
		TenantID:      tenantID,
		Name:          name,
		Description:   description,
		Status:        StatusPending,
		Config:        config,
		Metadata:      make(map[string]string),
	}

	d.RecordEvent(NewDeploymentCreatedEvent(d.ID, tenantID, name, config))
	return d, nil
}

// Submit transitions the deployment to PLANNING status.
func (d *Deployment) Submit() error {
	if !d.Status.CanTransitionTo(StatusPlanning) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = StatusPlanning
	d.RecordEvent(NewDeploymentStatusChangedEvent(d.ID, d.TenantID, StatusPending, StatusPlanning))
	return nil
}

// PlanComplete transitions to PLANNED status.
func (d *Deployment) PlanComplete(workflowID string) error {
	if !d.Status.CanTransitionTo(StatusPlanned) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = StatusPlanned
	d.WorkflowID = workflowID
	d.RecordEvent(NewDeploymentStatusChangedEvent(d.ID, d.TenantID, StatusPlanning, StatusPlanned))
	return nil
}

// Approve transitions to EXECUTING (if auto-approve) or marks as approved.
func (d *Deployment) Approve(approver string) error {
	target := StatusExecuting
	if !d.Status.CanTransitionTo(target) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = target
	d.RecordEvent(NewDeploymentApprovedEvent(d.ID, d.TenantID, approver))
	return nil
}

// StartExecution transitions to EXECUTING status.
func (d *Deployment) StartExecution() error {
	if !d.Status.CanTransitionTo(StatusExecuting) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = StatusExecuting
	d.RecordEvent(NewDeploymentStatusChangedEvent(d.ID, d.TenantID, StatusPlanned, StatusExecuting))
	return nil
}

// Complete transitions to APPLIED status.
func (d *Deployment) Complete() error {
	if !d.Status.CanTransitionTo(StatusApplied) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = StatusApplied
	d.RecordEvent(NewDeploymentCompletedEvent(d.ID, d.TenantID))
	return nil
}

// Fail transitions to FAILED status.
func (d *Deployment) Fail(err error) error {
	target := StatusFailed
	if !d.Status.CanTransitionTo(target) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = target
	if err != nil {
		d.Error = err.Error()
	}
	d.RecordEvent(NewDeploymentFailedEvent(d.ID, d.TenantID, d.Error))
	return nil
}

// Cancel transitions to CANCELLED status.
func (d *Deployment) Cancel(reason string) error {
	if !d.Status.CanTransitionTo(StatusCancelled) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = StatusCancelled
	d.RecordEvent(NewDeploymentCancelledEvent(d.ID, d.TenantID, reason))
	return nil
}

// StartRollback transitions to ROLLING_BACK status.
func (d *Deployment) StartRollback() error {
	if !d.Status.CanTransitionTo(StatusRollingBack) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	previous := d.Status
	d.Status = StatusRollingBack
	d.RecordEvent(NewDeploymentStatusChangedEvent(d.ID, d.TenantID, previous, StatusRollingBack))
	return nil
}

// RollbackComplete transitions to ROLLED_BACK status.
func (d *Deployment) RollbackComplete() error {
	if !d.Status.CanTransitionTo(StatusRolledBack) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = StatusRolledBack
	d.RecordEvent(NewDeploymentStatusChangedEvent(d.ID, d.TenantID, StatusRollingBack, StatusRolledBack))
	return nil
}

// StartDestroy transitions to DESTROYING status.
func (d *Deployment) StartDestroy() error {
	if !d.Status.CanTransitionTo(StatusDestroying) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	previous := d.Status
	d.Status = StatusDestroying
	d.RecordEvent(NewDeploymentStatusChangedEvent(d.ID, d.TenantID, previous, StatusDestroying))
	return nil
}

// DestroyComplete transitions to DESTROYED status.
func (d *Deployment) DestroyComplete() error {
	if !d.Status.CanTransitionTo(StatusDestroyed) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = StatusDestroyed
	d.RecordEvent(NewDeploymentDestroyedEvent(d.ID, d.TenantID))
	return nil
}

// DetectDrift transitions to DRIFTED status.
func (d *Deployment) DetectDrift() error {
	if !d.Status.CanTransitionTo(StatusDrifted) {
		return shared.ErrInvalidState("Deployment", string(d.Status))
	}
	d.Status = StatusDrifted
	d.RecordEvent(NewDeploymentDriftedEvent(d.ID, d.TenantID))
	return nil
}
