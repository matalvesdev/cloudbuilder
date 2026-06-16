package messaging

import (
	"context"
	"encoding/json"
	"fmt"
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

type EventPublisher struct {
	onEvent func(DeploymentEvent)
}

func NewEventPublisher() *EventPublisher {
	return &EventPublisher{
		onEvent: func(e DeploymentEvent) {
			data, _ := json.Marshal(e)
			fmt.Printf("[EVENT] %s\n", string(data))
		},
	}
}

func (p *EventPublisher) Publish(ctx context.Context, event DeploymentEvent) error {
	event.Timestamp = time.Now()
	p.onEvent(event)
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
