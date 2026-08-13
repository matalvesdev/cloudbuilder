package state

// StateStatus represents the synchronization status.
type StateStatus string

const (
	Synced   StateStatus = "SYNCED"
	Drifted  StateStatus = "DRIFTED"
	Pending  StateStatus = "PENDING"
	Conflict StateStatus = "CONFLICT"
)

// DiffType classifies the difference between desired and current state.
type DiffType string

const (
	DiffAdded    DiffType = "ADDED"
	DiffRemoved  DiffType = "REMOVED"
	DiffModified DiffType = "MODIFIED"
	DiffNone     DiffType = "NONE"
)

// StateDiff represents a difference between desired and current state.
type StateDiff struct {
	ResourceAddress string                 `json:"resourceAddress"`
	Type            DiffType              `json:"type"`
	Desired         map[string]interface{} `json:"desired,omitempty"`
	Current         map[string]interface{} `json:"current,omitempty"`
	Changes         []PropertyChange       `json:"changes,omitempty"`
}

// PropertyChange describes a single property change.
type PropertyChange struct {
	Property string `json:"property"`
	Before   string `json:"before"`
	After    string `json:"after"`
}

// StateVersion tracks a version of state for a resource.
type StateVersion struct {
	Version   int                    `json:"version"`
	State     map[string]interface{} `json:"state"`
	SnapshotID string                `json:"snapshotId,omitempty"`
	Trigger   string                 `json:"trigger"` // apply, rollback, import, refresh
	CreatedAt string                 `json:"createdAt"`
}
