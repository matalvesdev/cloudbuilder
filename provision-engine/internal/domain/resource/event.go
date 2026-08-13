package resource

import "github.com/cloudbuilder/provision-engine/internal/domain/shared"

type ResourceCreatedEvent struct {
	shared.BaseEvent
}

type ResourceUpdatedEvent struct {
	shared.BaseEvent
}

type ResourceDeletedEvent struct {
	shared.BaseEvent
}

type ResourceStateChangedEvent struct {
	shared.BaseEvent
	OldState string `json:"oldState"`
	NewState string `json:"newState"`
}

type ResourceDriftedEvent struct {
	shared.BaseEvent
	Diff string `json:"diff"`
}
