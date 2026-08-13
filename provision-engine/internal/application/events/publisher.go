package events

import (
	"context"
	"sync"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// EventHandler processes domain events.
type EventHandler interface {
	Handle(ctx context.Context, event shared.DomainEvent) error
}

// Publisher publishes domain events to subscribers.
type Publisher struct {
	mu          sync.RWMutex
	subscribers map[string][]EventHandler
}

// NewPublisher creates a new event publisher.
func NewPublisher() *Publisher {
	return &Publisher{
		subscribers: make(map[string][]EventHandler),
	}
}

// Subscribe registers a handler for an event type.
func (p *Publisher) Subscribe(eventType string, handler EventHandler) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.subscribers[eventType] = append(p.subscribers[eventType], handler)
}

// Publish sends an event to all registered handlers.
func (p *Publisher) Publish(ctx context.Context, event shared.DomainEvent) error {
	p.mu.RLock()
	handlers := p.subscribers[event.EventType()]
	p.mu.RUnlock()

	for _, handler := range handlers {
		if err := handler.Handle(ctx, event); err != nil {
			return err
		}
	}
	return nil
}

// EventStore persists events for replay.
type EventStore interface {
	Append(ctx context.Context, events ...shared.DomainEvent) error
	GetByAggregateID(ctx context.Context, aggregateID string, afterVersion int) ([]shared.DomainEvent, error)
	GetByType(ctx context.Context, eventType string, limit int) ([]shared.DomainEvent, error)
}

// InMemoryEventStore is a simple in-memory event store for development.
type InMemoryEventStore struct {
	mu     sync.RWMutex
	events []shared.DomainEvent
}

// NewInMemoryEventStore creates a new in-memory event store.
func NewInMemoryEventStore() *InMemoryEventStore {
	return &InMemoryEventStore{
		events: make([]shared.DomainEvent, 0),
	}
}

// Append adds events to the store.
func (s *InMemoryEventStore) Append(ctx context.Context, events ...shared.DomainEvent) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.events = append(s.events, events...)
	return nil
}

// GetByAggregateID returns events for an aggregate.
func (s *InMemoryEventStore) GetByAggregateID(ctx context.Context, aggregateID string, afterVersion int) ([]shared.DomainEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []shared.DomainEvent
	for _, e := range s.events {
		if e.AggregateID() == aggregateID && e.Version() > afterVersion {
			result = append(result, e)
		}
	}
	return result, nil
}

// GetByType returns events of a specific type.
func (s *InMemoryEventStore) GetByType(ctx context.Context, eventType string, limit int) ([]shared.DomainEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []shared.DomainEvent
	for _, e := range s.events {
		if e.EventType() == eventType {
			result = append(result, e)
			if limit > 0 && len(result) >= limit {
				break
			}
		}
	}
	return result, nil
}

// EventMetrics tracks event processing metrics.
type EventMetrics struct {
	EventsPublished int64         `json:"eventsPublished"`
	EventsProcessed int64         `json:"eventsProcessed"`
	EventsFailed    int64         `json:"eventsFailed"`
	AvgProcessTime  time.Duration `json:"avgProcessTime"`
}
