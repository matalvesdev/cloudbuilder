package state

import "github.com/cloudbuilder/provision-engine/internal/domain/shared"

type StateSyncedEvent struct {
	shared.BaseEvent
}

type StateDriftDetectedEvent struct {
	shared.BaseEvent
}
