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

	publisher := &EventPublisher{
		onEvent: func(e DeploymentEvent) {
			mu.Lock()
			receivedEvents = append(receivedEvents, e)
			mu.Unlock()
		},
	}

	ctx := context.Background()
	err := publisher.Publish(ctx, DeploymentEvent{
		DeploymentID: "dep-123",
		EventType:    EventDeploymentStarted,
		Status:       "started",
		Message:      "Deployment started",
	})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

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
}

func TestEventPublisher_PublishProgress(t *testing.T) {
	var lastProgress DeploymentEvent

	publisher := &EventPublisher{
		onEvent: func(e DeploymentEvent) {
			lastProgress = e
		},
	}

	ctx := context.Background()
	err := publisher.PublishProgress(ctx, "dep-456", "applying", 50, "Applying infrastructure...")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if lastProgress.DeploymentID != "dep-456" {
		t.Errorf("expected deployment ID 'dep-456', got '%s'", lastProgress.DeploymentID)
	}
	if lastProgress.Progress != 50 {
		t.Errorf("expected progress 50, got %d", lastProgress.Progress)
	}
	if lastProgress.Message != "Applying infrastructure..." {
		t.Errorf("expected message 'Applying infrastructure...', got '%s'", lastProgress.Message)
	}
}

func TestNewEventPublisher_DefaultLogger(t *testing.T) {
	// Default publisher should not panic
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
	var event DeploymentEvent
	publisher := &EventPublisher{
		onEvent: func(e DeploymentEvent) {
			event = e
		},
	}

	before := time.Now()
	publisher.Publish(context.Background(), DeploymentEvent{
		DeploymentID: "ts-test",
		EventType:    EventDriftDetected,
	})
	after := time.Now()

	if event.Timestamp.Before(before) || event.Timestamp.After(after) {
		t.Error("timestamp should be between before and after the publish call")
	}
}
