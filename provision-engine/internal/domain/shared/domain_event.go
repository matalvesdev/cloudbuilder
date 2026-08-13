package shared

import "time"

// DomainEvent represents a state change in the domain.
// All domain events must implement this interface.
type DomainEvent interface {
	// EventID returns the unique identifier for this event instance.
	EventID() string

	// EventType returns the type of event (e.g., "deployment.created").
	EventType() string

	// AggregateID returns the ID of the aggregate that emitted this event.
	AggregateID() string

	// AggregateType returns the type of aggregate (e.g., "Deployment").
	AggregateType() string

	// TenantID returns the tenant that owns this event.
	TenantID() string

	// OccurredAt returns when this event occurred.
	OccurredAt() time.Time

	// Version returns the aggregate version when this event was recorded.
	Version() int

	// Payload returns the event-specific data.
	Payload() interface{}
}

// BaseEvent provides a default implementation for common event fields.
type BaseEvent struct {
	ID            string      `json:"eventId"`
	Type          string      `json:"eventType"`
	AggID         string      `json:"aggregateId"`
	AggType       string      `json:"aggregateType"`
	Tenant        string      `json:"tenantId"`
	Timestamp     time.Time   `json:"occurredAt"`
	EventVersion  int         `json:"version"`
	Data          interface{} `json:"payload"`
	CorrelationID string      `json:"correlationId,omitempty"`
	CausationID   string      `json:"causationId,omitempty"`
}

func (e BaseEvent) EventID() string        { return e.ID }
func (e BaseEvent) EventType() string      { return e.Type }
func (e BaseEvent) AggregateID() string    { return e.AggID }
func (e BaseEvent) AggregateType() string  { return e.AggType }
func (e BaseEvent) TenantID() string       { return e.Tenant }
func (e BaseEvent) OccurredAt() time.Time  { return e.Timestamp }
func (e BaseEvent) Version() int           { return e.EventVersion }
func (e BaseEvent) Payload() interface{}   { return e.Data }

// NewBaseEvent creates a BaseEvent with generated ID and current timestamp.
func NewBaseEvent(eventType, aggID, aggType, tenantID string, version int, payload interface{}) BaseEvent {
	return BaseEvent{
		ID:        GenerateID(),
		Type:      eventType,
		AggID:     aggID,
		AggType:   aggType,
		Tenant:    tenantID,
		Timestamp:    time.Now().UTC(),
		EventVersion: version,
		Data:         payload,
	}
}
