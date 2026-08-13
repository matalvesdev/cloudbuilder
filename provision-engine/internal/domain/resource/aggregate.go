package resource

import (
	"sync"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// ManagedResource is the aggregate root for an infrastructure resource.
type ManagedResource struct {
	shared.AggregateRoot
	DeploymentID string                 `json:"deploymentId"`
	TenantID     string                 `json:"tenantId"`
	Provider     string                 `json:"provider"`
	Type         string                 `json:"type"`
	Name         string                 `json:"name"`
	Address      string                 `json:"address"`
	State        ResourceState          `json:"state"`
	Config       map[string]interface{} `json:"config"`
	Dependencies []string               `json:"dependencies,omitempty"`
	Metadata     map[string]string      `json:"metadata,omitempty"`
	mu           sync.RWMutex           `json:"-"`
	lockedBy     string
	lockedAt     *time.Time
	lockTTL      time.Duration
}

// NewManagedResource creates a new managed resource.
func NewManagedResource(deploymentID, tenantID, provider, resType, name, address string, config map[string]interface{}) *ManagedResource {
	return &ManagedResource{
		AggregateRoot: shared.NewAggregateRoot(),
		DeploymentID:  deploymentID,
		TenantID:      tenantID,
		Provider:      provider,
		Type:          resType,
		Name:          name,
		Address:       address,
		State:         RStatePending,
		Config:        config,
		Dependencies:  make([]string, 0),
		Metadata:      make(map[string]string),
		lockTTL:       5 * time.Minute,
	}
}

// AcquireLock attempts to acquire a distributed lock on the resource.
func (r *ManagedResource) AcquireLock(holder string, ttl time.Duration) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.lockedBy != "" && r.lockedAt != nil && time.Since(*r.lockedAt) < r.lockTTL {
		return false
	}

	now := time.Now().UTC()
	r.lockedBy = holder
	r.lockedAt = &now
	r.lockTTL = ttl
	return true
}

// ReleaseLock releases the distributed lock.
func (r *ManagedResource) ReleaseLock() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.lockedBy = ""
	r.lockedAt = nil
}

// IsLocked returns whether the resource is currently locked.
func (r *ManagedResource) IsLocked() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if r.lockedBy == "" {
		return false
	}
	if r.lockedAt != nil && time.Since(*r.lockedAt) >= r.lockTTL {
		return false
	}
	return true
}

// UpdateState transitions the resource to a new state.
func (r *ManagedResource) UpdateState(newState ResourceState) {
	oldState := r.State
	r.State = newState
	r.RecordEvent(ResourceStateChangedEvent{
		BaseEvent: shared.NewBaseEvent("resource.state_changed", r.ID, "ManagedResource", r.TenantID, 0, nil),
		OldState:  string(oldState),
		NewState:  string(newState),
	})
}

// AddDependency adds a dependency to the resource.
func (r *ManagedResource) AddDependency(resourceID string) {
	r.Dependencies = append(r.Dependencies, resourceID)
}

// SetMetadata sets a metadata key-value pair.
func (r *ManagedResource) SetMetadata(key, value string) {
	if r.Metadata == nil {
		r.Metadata = make(map[string]string)
	}
	r.Metadata[key] = value
}
