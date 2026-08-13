package deployment

import "github.com/cloudbuilder/provision-engine/internal/domain/shared"

// ─── Deployment Events ──────────────────────────────────────────────────

type DeploymentCreatedEvent struct {
	shared.BaseEvent
	Name   string           `json:"name"`
	Config DeploymentConfig `json:"config"`
}

func NewDeploymentCreatedEvent(id, tenantID, name string, config DeploymentConfig) DeploymentCreatedEvent {
	return DeploymentCreatedEvent{
		BaseEvent: shared.NewBaseEvent("deployment.created", id, "Deployment", tenantID, 1, nil),
		Name:      name,
		Config:    config,
	}
}

type DeploymentStatusChangedEvent struct {
	shared.BaseEvent
	From DeploymentStatus `json:"from"`
	To   DeploymentStatus `json:"to"`
}

func NewDeploymentStatusChangedEvent(id, tenantID string, from, to DeploymentStatus) DeploymentStatusChangedEvent {
	return DeploymentStatusChangedEvent{
		BaseEvent: shared.NewBaseEvent("deployment.status_changed", id, "Deployment", tenantID, 0, nil),
		From:      from,
		To:        to,
	}
}

type DeploymentApprovedEvent struct {
	shared.BaseEvent
	Approver string `json:"approver"`
}

func NewDeploymentApprovedEvent(id, tenantID, approver string) DeploymentApprovedEvent {
	return DeploymentApprovedEvent{
		BaseEvent: shared.NewBaseEvent("deployment.approved", id, "Deployment", tenantID, 0, nil),
		Approver:  approver,
	}
}

type DeploymentCompletedEvent struct {
	shared.BaseEvent
}

func NewDeploymentCompletedEvent(id, tenantID string) DeploymentCompletedEvent {
	return DeploymentCompletedEvent{
		BaseEvent: shared.NewBaseEvent("deployment.completed", id, "Deployment", tenantID, 0, nil),
	}
}

type DeploymentFailedEvent struct {
	shared.BaseEvent
	Error string `json:"error"`
}

func NewDeploymentFailedEvent(id, tenantID, errMsg string) DeploymentFailedEvent {
	return DeploymentFailedEvent{
		BaseEvent: shared.NewBaseEvent("deployment.failed", id, "Deployment", tenantID, 0, nil),
		Error:     errMsg,
	}
}

type DeploymentCancelledEvent struct {
	shared.BaseEvent
	Reason string `json:"reason"`
}

func NewDeploymentCancelledEvent(id, tenantID, reason string) DeploymentCancelledEvent {
	return DeploymentCancelledEvent{
		BaseEvent: shared.NewBaseEvent("deployment.cancelled", id, "Deployment", tenantID, 0, nil),
		Reason:    reason,
	}
}

type DeploymentDestroyedEvent struct {
	shared.BaseEvent
}

func NewDeploymentDestroyedEvent(id, tenantID string) DeploymentDestroyedEvent {
	return DeploymentDestroyedEvent{
		BaseEvent: shared.NewBaseEvent("deployment.destroyed", id, "Deployment", tenantID, 0, nil),
	}
}

type DeploymentDriftedEvent struct {
	shared.BaseEvent
}

func NewDeploymentDriftedEvent(id, tenantID string) DeploymentDriftedEvent {
	return DeploymentDriftedEvent{
		BaseEvent: shared.NewBaseEvent("deployment.drifted", id, "Deployment", tenantID, 0, nil),
	}
}
