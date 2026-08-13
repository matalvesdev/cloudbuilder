package execution

import "github.com/cloudbuilder/provision-engine/internal/domain/shared"

type ExecutionStartedEvent struct {
	shared.BaseEvent
}

type ExecutionCompletedEvent struct {
	shared.BaseEvent
}

type ExecutionFailedEvent struct {
	shared.BaseEvent
	Error string `json:"error"`
}
