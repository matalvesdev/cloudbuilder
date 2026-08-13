package shared

import (
	"crypto/rand"
	"fmt"
	"time"
)

// AggregateRoot is the base for all domain aggregates.
// It tracks identity, versioning, timestamps, and domain events.
type AggregateRoot struct {
	ID        string        `json:"id"`
	Version   int           `json:"version"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`
	events    []DomainEvent `json:"-"`
}

// NewAggregateRoot creates a new aggregate with a generated ID.
func NewAggregateRoot(id ...string) AggregateRoot {
	now := time.Now().UTC()
	aid := GenerateID()
	if len(id) > 0 && id[0] != "" {
		aid = id[0]
	}
	return AggregateRoot{
		ID:        aid,
		Version:   0,
		CreatedAt: now,
		UpdatedAt: now,
		events:    make([]DomainEvent, 0),
	}
}

// RecordEvent appends a domain event to the aggregate's uncommitted events.
func (a *AggregateRoot) RecordEvent(event DomainEvent) {
	a.events = append(a.events, event)
	a.Version++
	a.UpdatedAt = time.Now().UTC()
}

// PullEvents returns and clears all uncommitted domain events.
func (a *AggregateRoot) PullEvents() []DomainEvent {
	events := a.events
	a.events = make([]DomainEvent, 0)
	return events
}

// Events returns the current uncommitted events (read-only).
func (a *AggregateRoot) Events() []DomainEvent {
	return a.events
}

// HasUncommittedEvents returns true if there are events to publish.
func (a *AggregateRoot) HasUncommittedEvents() bool {
	return len(a.events) > 0
}

// GenerateID produces a UUID v4 string.
func GenerateID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40 // Version 4
	b[8] = (b[8] & 0x3f) | 0x80 // Variant 10
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
