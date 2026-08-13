package workflow

import "github.com/cloudbuilder/provision-engine/internal/domain/shared"

// ─── Workflow Events ────────────────────────────────────────────────────

type WorkflowStartedEvent struct {
	shared.BaseEvent
}

type WorkflowStepCompletedEvent struct {
	shared.BaseEvent
	StepID string `json:"stepId"`
}

type WorkflowStepFailedEvent struct {
	shared.BaseEvent
	StepID string `json:"stepId"`
	Error  string `json:"error"`
}

type WorkflowCompletedEvent struct {
	shared.BaseEvent
}

type WorkflowFailedEvent struct {
	shared.BaseEvent
	Error string `json:"error"`
}

type WorkflowCancelledEvent struct {
	shared.BaseEvent
	Reason string `json:"reason"`
}
