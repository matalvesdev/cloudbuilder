package messaging

import (
	"context"
	"testing"
	"time"
)

func TestKafkaProducer_DisabledByDefault(t *testing.T) {
	config := DefaultKafkaConfig()
	if config.Enabled {
		t.Fatal("expected Enabled to be false by default")
	}

	kp := NewKafkaProducer(config)
	if kp.IsEnabled() {
		t.Fatal("expected KafkaProducer to be disabled")
	}

	// Produce should succeed silently (no-op)
	err := kp.Produce(context.Background(), DeploymentEvent{
		DeploymentID: "test-123",
		EventType:    EventDeploymentStarted,
		Status:       "started",
	})
	if err != nil {
		t.Fatalf("expected no error when disabled, got: %v", err)
	}
}

func TestKafkaProducer_CloseWhenDisabled(t *testing.T) {
	kp := NewKafkaProducer(DefaultKafkaConfig())
	err := kp.Close()
	if err != nil {
		t.Fatalf("expected no error closing disabled producer, got: %v", err)
	}
}

func TestKafkaProducer_TopicCount(t *testing.T) {
	kp := NewKafkaProducer(DefaultKafkaConfig())
	if kp.TopicCount() != 0 {
		t.Fatalf("expected 0 topics when disabled, got %d", kp.TopicCount())
	}
}

func TestKafkaProducer_RouteEvent(t *testing.T) {
	tests := []struct {
		eventType EventType
		expected  string
	}{
		{EventDeploymentStarted, "deployment.events"},
		{EventDeploying, "deployment.events"},
		{EventDeploymentComplete, "deployment.events"},
		{EventDeploymentFailed, "deployment.events"},
		{EventDriftDetected, "observability.events"},
		{EventDriftResolved, "observability.events"},
	}

	for _, tt := range tests {
		topic := routeEvent(tt.eventType)
		if topic != tt.expected {
			t.Errorf("event %s: expected topic %s, got %s", tt.eventType, tt.expected, topic)
		}
	}
}

func TestEventPublisher_WithKafkaProducer(t *testing.T) {
	// Disabled Kafka — events still go to local subscribers
	config := DefaultKafkaConfig()
	kp := NewKafkaProducer(config)

	publisher := NewEventPublisherWithKafka(kp)
	ctx := context.Background()

	sub := publisher.Subscribe("kafka-test")
	defer publisher.Unsubscribe("kafka-test")

	err := publisher.Publish(ctx, DeploymentEvent{
		DeploymentID: "kafka-1",
		EventType:    EventDeploymentStarted,
		Status:       "started",
	})
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	select {
	case evt := <-sub.Events:
		if evt.DeploymentID != "kafka-1" {
			t.Errorf("expected deployment ID 'kafka-1', got '%s'", evt.DeploymentID)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("timeout waiting for event")
	}
}

func TestEventPublisher_SetKafka(t *testing.T) {
	publisher := NewEventPublisher()

	if publisher.kafka != nil {
		t.Fatal("expected nil kafka producer initially")
	}

	kp := NewKafkaProducer(DefaultKafkaConfig())
	publisher.SetKafka(kp)

	if publisher.kafka == nil {
		t.Fatal("expected kafka producer to be set")
	}

	// Detach
	publisher.SetKafka(nil)
	if publisher.kafka != nil {
		t.Fatal("expected kafka producer to be nil after detach")
	}
}
