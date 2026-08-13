package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all configuration for the provision engine.
// Resolution order: CLI flags (highest) > Environment variables > Defaults (lowest).
// This follows 12-Factor App Factor III: Store config in the environment.
type Config struct {
	// Server
	GRPCHost     string
	GRPCPort     int
	HealthPort   int
	CollabPort   int
	ReadTimeout  time.Duration
	WriteTimeout time.Duration

	// Logging
	LogLevel  string
	LogFormat string // "json" or "console"

	// Kafka
	KafkaEnabled   bool
	KafkaBrokers   []string
	KafkaTimeout   time.Duration
	KafkaBatchSize int

	// Auth
	JWTSecret            string
	CollabAllowedOrigins []string

	// Build info (injected at compile time)
	Version   string
	GitCommit string
	BuildDate string
}

// DefaultConfig returns sensible defaults for local development.
func DefaultConfig() *Config {
	return &Config{
		GRPCHost:       "0.0.0.0",
		GRPCPort:       50051,
		HealthPort:     50052,
		CollabPort:     8765,
		ReadTimeout:    5 * time.Second,
		WriteTimeout:   5 * time.Second,
		LogLevel:       "info",
		LogFormat:      "console",
		KafkaEnabled:   false,
		KafkaBrokers:   []string{"localhost:9092"},
		KafkaTimeout:   10 * time.Second,
		KafkaBatchSize: 100,
		JWTSecret:      "",
		CollabAllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
		},
		Version:   "dev",
		GitCommit: "unknown",
		BuildDate: "unknown",
	}
}

// Load creates a Config by reading environment variables with defaults.
// CLI flags should override these via the Apply* methods.
func Load() *Config {
	cfg := DefaultConfig()

	// Server
	cfg.GRPCHost = getEnv("GRPC_HOST", cfg.GRPCHost)
	cfg.GRPCPort = getEnvInt("GRPC_PORT", cfg.GRPCPort)
	cfg.HealthPort = getEnvInt("HEALTH_PORT", cfg.HealthPort)
	cfg.CollabPort = getEnvInt("COLLAB_PORT", cfg.CollabPort)

	// Logging
	cfg.LogLevel = getEnv("LOG_LEVEL", cfg.LogLevel)
	cfg.LogFormat = getEnv("LOG_FORMAT", cfg.LogFormat)

	// Kafka
	cfg.KafkaEnabled = getEnvBool("KAFKA_ENABLED", cfg.KafkaEnabled)
	if brokers := getEnv("KAFKA_BROKERS", ""); brokers != "" {
		cfg.KafkaBrokers = strings.Split(brokers, ",")
	}
	cfg.KafkaBatchSize = getEnvInt("KAFKA_BATCH_SIZE", cfg.KafkaBatchSize)

	// Auth
	cfg.JWTSecret = getEnv("JWT_SECRET", "")
	if origins := getEnv("COLLAB_ALLOWED_ORIGINS", ""); origins != "" {
		cfg.CollabAllowedOrigins = splitAndTrim(origins)
	}

	return cfg
}

// GRPCAddr returns the gRPC listen address (host:port).
func (c *Config) GRPCAddr() string {
	return c.GRPCHost + ":" + strconv.Itoa(c.GRPCPort)
}

// HealthAddr returns the HTTP health check listen address (:port).
func (c *Config) HealthAddr() string {
	return ":" + strconv.Itoa(c.HealthPort)
}

// CollabAddr returns the collaboration WebSocket listen address (:port).
func (c *Config) CollabAddr() string {
	return ":" + strconv.Itoa(c.CollabPort)
}

// --- Env helpers ---

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if v := os.Getenv(key); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return fallback
}

func splitAndTrim(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
