package messaging

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/segmentio/kafka-go"
)

// KafkaConfig holds the Kafka connection settings.
type KafkaConfig struct {
	Brokers       []string
	Enabled       bool
	WriteTimeout  time.Duration
	ReadTimeout   time.Duration
	BatchSize     int
	BatchTimeout  time.Duration
}

// DefaultKafkaConfig returns a sensible default configuration.
func DefaultKafkaConfig() KafkaConfig {
	return KafkaConfig{
		Brokers:      []string{"localhost:9092"},
		Enabled:      false,
		WriteTimeout: 10 * time.Second,
		ReadTimeout:  10 * time.Second,
		BatchSize:    100,
		BatchTimeout: 1 * time.Second,
	}
}

// KafkaProducer publishes DeploymentEvents to Kafka topics.
// It is designed to be optional: when Enabled=false, Publish()
// falls back to the local subscriber fan-out only.
type KafkaProducer struct {
	mu       sync.RWMutex
	config   KafkaConfig
	writers  map[string]*kafka.Writer
	enabled  bool
}

// NewKafkaProducer creates a new KafkaProducer with the given config.
// If config.Enabled is false, Publish() will only do local fan-out.
func NewKafkaProducer(config KafkaConfig) *KafkaProducer {
	p := &KafkaProducer{
		config:  config,
		writers: make(map[string]*kafka.Writer),
		enabled: config.Enabled,
	}

	if config.Enabled {
		p.initWriters()
	}

	return p
}

// initWriters creates one kafka.Writer per topic we produce to.
func (p *KafkaProducer) initWriters() {
	topics := []string{
		"deployment.events",
		"observability.events",
		"provisioning.events",
		"cost.events",
	}

	for _, topic := range topics {
		w := &kafka.Writer{
			Addr:         kafka.TCP(p.config.Brokers...),
			Topic:        topic,
			BatchSize:    p.config.BatchSize,
			BatchTimeout: p.config.BatchTimeout,
			WriteTimeout: p.config.WriteTimeout,
			// RequiredAcks: kafka.RequireAll, — default is RequireAll
			Async: true, // non-blocking; failures logged, not fatal
		}
		p.writers[topic] = w
	}

	log.Info().
		Strs("brokers", p.config.Brokers).
		Int("topics", len(p.writers)).
		Msg("Kafka producer initialized")
}

// routeEvent maps an EventType to the correct Kafka topic.
func routeEvent(eventType EventType) string {
	prefix := strings.SplitN(string(eventType), ".", 2)[0]
	switch prefix {
	case "deployment":
		return "deployment.events"
	case "drift":
		return "observability.events"
	case "deploying":
		return "deployment.events"
	default:
		return "provisioning.events"
	}
}

// Produce sends a DeploymentEvent to the appropriate Kafka topic.
// Returns nil if Kafka is disabled (local fan-out only).
func (p *KafkaProducer) Produce(ctx context.Context, event DeploymentEvent) error {
	if !p.enabled {
		return nil
	}

	topic := routeEvent(event.EventType)

	w, ok := p.writers[topic]
	if !ok {
		return fmt.Errorf("no writer for topic %s", topic)
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	msg := kafka.Message{
		Key:   []byte(event.DeploymentID),
		Value: payload,
		Headers: []kafka.Header{
			{Key: "event-type", Value: []byte(string(event.EventType))},
			{Key: "source", Value: []byte("provision-engine")},
			{Key: "timestamp", Value: []byte(event.Timestamp.Format(time.RFC3339))},
		},
	}

	if err := w.WriteMessages(ctx, msg); err != nil {
		log.Warn().
			Err(err).
			Str("topic", topic).
			Str("deploymentId", event.DeploymentID).
			Msg("Failed to publish event to Kafka")
		return fmt.Errorf("write to kafka: %w", err)
	}

	log.Debug().
		Str("topic", topic).
		Str("eventType", string(event.EventType)).
		Str("deploymentId", event.DeploymentID).
		Msg("Event published to Kafka")

	return nil
}

// Close flushes and closes all Kafka writers. Safe to call when disabled.
func (p *KafkaProducer) Close() error {
	if !p.enabled {
		return nil
	}

	var firstErr error
	for topic, w := range p.writers {
		if err := w.Close(); err != nil {
			log.Error().Err(err).Str("topic", topic).Msg("Error closing Kafka writer")
			if firstErr == nil {
				firstErr = err
			}
		}
	}
	return firstErr
}

// IsEnabled returns whether the Kafka producer is active.
func (p *KafkaProducer) IsEnabled() bool {
	return p.enabled
}

// TopicCount returns the number of Kafka topics configured for writing.
func (p *KafkaProducer) TopicCount() int {
	return len(p.writers)
}
