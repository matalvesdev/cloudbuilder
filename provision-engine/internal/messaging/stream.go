package messaging

import (
	"context"
	"time"
)

// StreamEvent converts a DeploymentEvent into a generic event that can be
// sent over gRPC streaming or any other transport.
// This is the bridge between EventPublisher and gRPC WatchEvents.
type StreamEvent struct {
	DeploymentID string
	EventType    string
	Status       string
	Message      string
	Progress     int32
	Timestamp    time.Time
}

// ToStreamEvent converts a DeploymentEvent to a StreamEvent.
func (e DeploymentEvent) ToStreamEvent() StreamEvent {
	return StreamEvent{
		DeploymentID: e.DeploymentID,
		EventType:    string(e.EventType),
		Status:       e.Status,
		Message:      e.Message,
		Progress:     int32(e.Progress),
		Timestamp:    e.Timestamp,
	}
}

// SubscribeToEvents creates a subscriber on the publisher and returns
// a channel that receives StreamEvents. The caller must consume from
// the channel. Cancel the context to unsubscribe.
//
// Usage:
//
//	ch := publisher.SubscribeToEvents(ctx, "my-consumer")
//	for event := range ch {
//	    // handle event
//	}
func (p *EventPublisher) SubscribeToEvents(ctx context.Context, id string) <-chan StreamEvent {
	sub := p.Subscribe(id)
	out := make(chan StreamEvent, 100)

	go func() {
		defer p.Unsubscribe(id)
		defer close(out)

		for {
			select {
			case <-ctx.Done():
				return
			case evt, ok := <-sub.Events:
				if !ok {
					return
				}
				select {
				case out <- evt.ToStreamEvent():
				default:
					// Drop if consumer is slow
				}
			}
		}
	}()

	return out
}
