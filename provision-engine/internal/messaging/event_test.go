package messaging

import (
	"context"
	"sync"
	"testing"
	"time"
)

func TestEventPublisher_Publish(t *testing.T) {
	var mu sync.Mutex
	var receivedEvents []DeploymentEvent

	publisher := NewEventPublisher()
	ctx := context.Background()

	// Subscribe to receive events
	sub := publisher.Subscribe("test-publish")
	go func() {
		for evt := range sub.Events {
			mu.Lock()
			receivedEvents = append(receivedEvents, evt)
			mu.Unlock()
		}
	}()

	err := publisher.Publish(ctx, DeploymentEvent{
		DeploymentID: "dep-123",
		EventType:    EventDeploymentStarted,
		Status:       "started",
		Message:      "Deployment started",
	})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// Give goroutine time to receive
	time.Sleep(50 * time.Millisecond)

	mu.Lock()
	if len(receivedEvents) != 1 {
		t.Fatalf("expected 1 event, got %d", len(receivedEvents))
	}
	if receivedEvents[0].DeploymentID != "dep-123" {
		t.Errorf("expected deployment ID 'dep-123', got '%s'", receivedEvents[0].DeploymentID)
	}
	if receivedEvents[0].EventType != EventDeploymentStarted {
		t.Errorf("expected event type '%s', got '%s'", EventDeploymentStarted, receivedEvents[0].EventType)
	}
	if receivedEvents[0].Timestamp.IsZero() {
		t.Error("expected timestamp to be set")
	}
	mu.Unlock()

	publisher.Unsubscribe("test-publish")
}

func TestEventPublisher_PublishProgress(t *testing.T) {
	var lastProgress DeploymentEvent
	var mu sync.Mutex

	publisher := NewEventPublisher()
	ctx := context.Background()

	sub := publisher.Subscribe("test-progress")
	done := make(chan struct{})
	go func() {
		for evt := range sub.Events {
			mu.Lock()
			lastProgress = evt
			mu.Unlock()
			close(done)
			return
		}
	}()

	err := publisher.PublishProgress(ctx, "dep-456", "applying", 50, "Applying infrastructure...")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	select {
	case <-done:
	case <-time.After(100 * time.Millisecond):
		t.Fatal("timeout waiting for event")
	}

	mu.Lock()
	if lastProgress.DeploymentID != "dep-456" {
		t.Errorf("expected deployment ID 'dep-456', got '%s'", lastProgress.DeploymentID)
	}
	if lastProgress.Progress != 50 {
		t.Errorf("expected progress 50, got %d", lastProgress.Progress)
	}
	if lastProgress.Message != "Applying infrastructure..." {
		t.Errorf("expected message 'Applying infrastructure...', got '%s'", lastProgress.Message)
	}
	mu.Unlock()

	publisher.Unsubscribe("test-progress")
}

func TestNewEventPublisher_DefaultLogger(t *testing.T) {
	publisher := NewEventPublisher()
	ctx := context.Background()

	err := publisher.Publish(ctx, DeploymentEvent{
		DeploymentID: "test",
		EventType:    EventDeploymentComplete,
		Status:       "done",
	})

	if err != nil {
		t.Errorf("expected no error, got: %v", err)
	}
}

func TestEventPublisher_EventTypes(t *testing.T) {
	tests := []struct {
		eventType EventType
		expected  string
	}{
		{EventDeploymentStarted, "deployment.started"},
		{EventDeploying, "deploying"},
		{EventDeploymentComplete, "deployment.complete"},
		{EventDeploymentFailed, "deployment.failed"},
		{EventDriftDetected, "drift.detected"},
		{EventDriftResolved, "drift.resolved"},
	}

	for _, tt := range tests {
		if string(tt.eventType) != tt.expected {
			t.Errorf("expected '%s', got '%s'", tt.expected, string(tt.eventType))
		}
	}
}

func TestEventPublisher_Timestamp(t *testing.T) {
	publisher := NewEventPublisher()
	sub := publisher.Subscribe("test-ts")
	done := make(chan DeploymentEvent, 1)
	go func() {
		for evt := range sub.Events {
			done <- evt
			return
		}
	}()

	before := time.Now()
	publisher.Publish(context.Background(), DeploymentEvent{
		DeploymentID: "ts-test",
		EventType:    EventDriftDetected,
	})
	after := time.Now()

	select {
	case event := <-done:
		if event.Timestamp.Before(before) || event.Timestamp.After(after) {
			t.Error("timestamp should be between before and after the publish call")
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("timeout waiting for event")
	}

	publisher.Unsubscribe("test-ts")
}

func TestEventPublisher_MultipleSubscribers(t *testing.T) {
	publisher := NewEventPublisher()
	ctx := context.Background()

	sub1 := publisher.Subscribe("sub1")
	sub2 := publisher.Subscribe("sub2")

	received1 := make(chan struct{}, 1)
	received2 := make(chan struct{}, 1)

	go func() {
		<-sub1.Events
		received1 <- struct{}{}
	}()
	go func() {
		<-sub2.Events
		received2 <- struct{}{}
	}()

	publisher.Publish(ctx, DeploymentEvent{
		DeploymentID: "multi",
		EventType:    EventDeploymentStarted,
		Status:       "started",
	})

	select {
	case <-received1:
	case <-time.After(100 * time.Millisecond):
		t.Error("subscriber 1 did not receive event")
	}
	select {
	case <-received2:
	case <-time.After(100 * time.Millisecond):
		t.Error("subscriber 2 did not receive event")
	}

	publisher.Unsubscribe("sub1")
	publisher.Unsubscribe("sub2")
}

func TestEventPublisher_SubscriberCount(t *testing.T) {
	publisher := NewEventPublisher()

	if count := publisher.SubscriberCount(); count != 0 {
		t.Errorf("expected 0 subscribers, got %d", count)
	}

	publisher.Subscribe("a")
	publisher.Subscribe("b")

	if count := publisher.SubscriberCount(); count != 2 {
		t.Errorf("expected 2 subscribers, got %d", count)
	}

	publisher.Unsubscribe("a")
	if count := publisher.SubscriberCount(); count != 1 {
		t.Errorf("expected 1 subscriber, got %d", count)
	}
}

func TestEventPublisher_UnsubscribeClosesChannel(t *testing.T) {
	publisher := NewEventPublisher()
	sub := publisher.Subscribe("close-test")

	publisher.Unsubscribe("close-test")

	_, ok := <-sub.Events
	if ok {
		t.Error("expected channel to be closed after unsubscribe")
	}
}

func TestSubscribeToEvents(t *testing.T) {
	publisher := NewEventPublisher()
	ctx := context.Background()

	eventCh := publisher.SubscribeToEvents(ctx, "stream-test")

	publisher.Publish(ctx, DeploymentEvent{
		DeploymentID: "stream-1",
		EventType:    EventDeploymentStarted,
		Status:       "started",
	})

	select {
	case evt := <-eventCh:
		if evt.DeploymentID != "stream-1" {
			t.Errorf("expected deployment ID 'stream-1', got '%s'", evt.DeploymentID)
		}
		if evt.EventType != string(EventDeploymentStarted) {
			t.Errorf("expected event type '%s', got '%s'", EventDeploymentStarted, evt.EventType)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("timeout waiting for stream event")
	}
}

func TestSubscribeToEvents_CancelContext(t *testing.T) {
	publisher := NewEventPublisher()
	ctx, cancel := context.WithCancel(context.Background())

	eventCh := publisher.SubscribeToEvents(ctx, "cancel-test")

	cancel()

	// After cancel, the channel should be closed
	_, ok := <-eventCh
	if ok {
		t.Error("expected event channel to be closed after context cancel")
	}
}
