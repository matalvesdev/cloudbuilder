package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
)

// Config holds Kafka configuration.
type Config struct {
	Brokers       []string      `mapstructure:"brokers"`
	ConsumerGroup string        `mapstructure:"consumer_group"`
	WriteTimeout  time.Duration `mapstructure:"write_timeout"`
	ReadTimeout   time.Duration `mapstructure:"read_timeout"`
	BatchSize     int           `mapstructure:"batch_size"`
}

// Producer publishes events to Kafka.
type Producer struct {
	writer *kafka.Writer
}

// NewProducer creates a new Kafka producer.
func NewProducer(cfg Config) *Producer {
	return &Producer{
		writer: &kafka.Writer{
			Addr:         kafka.TCP(cfg.Brokers...),
			BatchSize:    cfg.BatchSize,
			BatchTimeout: time.Second,
			WriteTimeout: cfg.WriteTimeout,
			Async:        true,
		},
	}
}

// Publish sends a message to a topic.
func (p *Producer) Publish(ctx context.Context, topic string, key string, value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("marshal message: %w", err)
	}
	return p.writer.WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: data,
	})
}

// Close closes the producer.
func (p *Producer) Close() error {
	return p.writer.Close()
}

// Consumer reads events from Kafka.
type Consumer struct {
	reader *kafka.Reader
}

// NewConsumer creates a new Kafka consumer.
func NewConsumer(cfg Config, topic string) *Consumer {
	return &Consumer{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers:  cfg.Brokers,
			Topic:    topic,
			GroupID:  cfg.ConsumerGroup,
			MinBytes: 1,
			MaxBytes: 10e6,
		}),
	}
}

// Message represents a Kafka message.
type Message struct {
	Key   []byte
	Value []byte
}

// Consume reads a single message.
func (c *Consumer) Consume(ctx context.Context) (*Message, error) {
	msg, err := c.reader.ReadMessage(ctx)
	if err != nil {
		return nil, err
	}
	return &Message{Key: msg.Key, Value: msg.Value}, nil
}

// Close closes the consumer.
func (c *Consumer) Close() error {
	return c.reader.Close()
}
