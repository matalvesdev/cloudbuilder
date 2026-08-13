package state

import (
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// StateEntry is the aggregate root for resource state management.
type StateEntry struct {
	shared.AggregateRoot
	ResourceID   string                 `json:"resourceId"`
	DeploymentID string                 `json:"deploymentId"`
	TenantID     string                 `json:"tenantId"`
	DesiredState map[string]interface{} `json:"desiredState"`
	CurrentState map[string]interface{} `json:"currentState"`
	Status       StateStatus            `json:"status"`
	Version      int                    `json:"version"`
}

// NewStateEntry creates a new state entry for a resource.
func NewStateEntry(resourceID, deploymentID, tenantID string, desiredState map[string]interface{}) *StateEntry {
	return &StateEntry{
		AggregateRoot: shared.NewAggregateRoot(),
		ResourceID:    resourceID,
		DeploymentID:  deploymentID,
		TenantID:      tenantID,
		DesiredState:  desiredState,
		CurrentState:  make(map[string]interface{}),
		Status:        Pending,
		Version:       1,
	}
}

// Sync updates the current state and marks as synced.
func (s *StateEntry) Sync(currentState map[string]interface{}) {
	s.CurrentState = currentState
	s.Status = Synced
	s.Version++
	s.RecordEvent(StateSyncedEvent{
		BaseEvent: shared.NewBaseEvent("state.synced", s.ID, "StateEntry", s.TenantID, s.Version, nil),
	})
}

// DetectDrift marks the state as drifted.
func (s *StateEntry) DetectDrift() {
	s.Status = Drifted
	s.RecordEvent(StateDriftDetectedEvent{
		BaseEvent: shared.NewBaseEvent("state.drift_detected", s.ID, "StateEntry", s.TenantID, s.Version, nil),
	})
}

// Reconcile applies the desired state to current state.
func (s *StateEntry) Reconcile() {
	s.CurrentState = copyMap(s.DesiredState)
	s.Status = Synced
	s.Version++
}

// ComputeDiff calculates the difference between desired and current state.
func (s *StateEntry) ComputeDiff() []StateDiff {
	if s.DesiredState == nil || s.CurrentState == nil {
		return nil
	}

	var diffs []StateDiff
	allKeys := make(map[string]bool)
	for k := range s.DesiredState {
		allKeys[k] = true
	}
	for k := range s.CurrentState {
		allKeys[k] = true
	}

	for key := range allKeys {
		desired, dOk := s.DesiredState[key]
		current, cOk := s.CurrentState[key]

		if dOk && !cOk {
			diffs = append(diffs, StateDiff{
				Type:    DiffAdded,
				Desired: map[string]interface{}{key: desired},
			})
		} else if !dOk && cOk {
			diffs = append(diffs, StateDiff{
				Type:    DiffRemoved,
				Current: map[string]interface{}{key: current},
			})
		} else if dOk && cOk && fmt.Sprintf("%v", desired) != fmt.Sprintf("%v", current) {
			diffs = append(diffs, StateDiff{
				Type: DiffModified,
				Changes: []PropertyChange{
					{Property: key, Before: fmt.Sprintf("%v", current), After: fmt.Sprintf("%v", desired)},
				},
			})
		}
	}
	return diffs
}

func copyMap(m map[string]interface{}) map[string]interface{} {
	cp := make(map[string]interface{}, len(m))
	for k, v := range m {
		cp[k] = v
	}
	return cp
}
