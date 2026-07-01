package messaging

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

type EventType string

const (
	EventDeploymentStarted  EventType = "deployment.started"
	EventDeploying          EventType = "deploying"
	EventDeploymentComplete EventType = "deployment.complete"
	EventDeploymentFailed   EventType = "deployment.failed"
	EventDriftDetected      EventType = "drift.detected"
	EventDriftResolved      EventType = "drift.resolved"
)

type DeploymentEvent struct {
	DeploymentID string    `json:"deploymentId"`
	EventType    EventType `json:"eventType"`
	Status       string    `json:"status"`
	Message      string    `json:"message"`
	Progress     int       `json:"progress"`
	Timestamp    time.Time `json:"timestamp"`
}

// Subscriber receives events published by EventPublisher.
// The channel is closed when the subscriber is removed.
type Subscriber struct {
	Events chan DeploymentEvent
	ID     string
}

// EventPublisher fans out deployment events to all registered subscribers.
// Every Publish call sends the event to:
//  1. All active subscribers (via channels)
//  2. The default stdout logger
//  3. Optionally Kafka (if KafkaProducer is attached)
//
// Thread-safe.
type EventPublisher struct {
	mu          sync.RWMutex
	subscribers map[string]*Subscriber
	kafka       *KafkaProducer
}

func NewEventPublisher() *EventPublisher {
	return &EventPublisher{
		subscribers: make(map[string]*Subscriber),
	}
}

// NewEventPublisherWithKafka creates an EventPublisher with optional Kafka egress.
func NewEventPublisherWithKafka(kp *KafkaProducer) *EventPublisher {
	return &EventPublisher{
		subscribers: make(map[string]*Subscriber),
		kafka:       kp,
	}
}

// SetKafka attaches (or detaches) a KafkaProducer at runtime.
func (p *EventPublisher) SetKafka(kp *KafkaProducer) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.kafka = kp
}

// Subscribe registers a new subscriber and returns it.
// The subscriber's Events channel is sized to prevent blocking.
// Caller MUST consume from the channel or use a goroutine.
func (p *EventPublisher) Subscribe(id string) *Subscriber {
	p.mu.Lock()
	defer p.mu.Unlock()

	sub := &Subscriber{
		Events: make(chan DeploymentEvent, 100),
		ID:     id,
	}
	p.subscribers[id] = sub
	return sub
}

// Unsubscribe removes a subscriber and closes its channel.
func (p *EventPublisher) Unsubscribe(id string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if sub, ok := p.subscribers[id]; ok {
		close(sub.Events)
		delete(p.subscribers, id)
	}
}

func (p *EventPublisher) Publish(ctx context.Context, event DeploymentEvent) error {
	event.Timestamp = time.Now()

	// Always log to stdout (backward compatible)
	data, _ := json.Marshal(event)
	fmt.Printf("[EVENT] %s\n", string(data))

	// Fan out to all subscribers
	p.mu.RLock()
	defer p.mu.RUnlock()

	for _, sub := range p.subscribers {
		select {
		case sub.Events <- event:
		default:
			// Subscriber too slow; drop event to avoid blocking
			fmt.Printf("[EVENT] dropping event for subscriber %s (buffer full)\n", sub.ID)
		}
	}

	// Optionally publish to Kafka (non-blocking best-effort)
	if p.kafka != nil && p.kafka.IsEnabled() {
		go func() {
			if err := p.kafka.Produce(ctx, event); err != nil {
				fmt.Printf("[EVENT] kafka publish failed: %v\n", err)
			}
		}()
	}

	return nil
}

func (p *EventPublisher) PublishProgress(ctx context.Context, deploymentID string, status string, progress int, message string) error {
	return p.Publish(ctx, DeploymentEvent{
		DeploymentID: deploymentID,
		EventType:    EventDeploying,
		Status:       status,
		Message:      message,
		Progress:     progress,
	})
}

// SubscriberCount returns the number of active subscribers.
func (p *EventPublisher) SubscriberCount() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return len(p.subscribers)
}
