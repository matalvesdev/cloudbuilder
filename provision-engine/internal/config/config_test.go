package config

import (
	"os"
	"testing"
	"time"
)

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()

	if cfg.GRPCPort != 50051 {
		t.Errorf("GRPCPort = %d, want 50051", cfg.GRPCPort)
	}
	if cfg.HealthPort != 50052 {
		t.Errorf("HealthPort = %d, want 50052", cfg.HealthPort)
	}
	if cfg.CollabPort != 8765 {
		t.Errorf("CollabPort = %d, want 8765", cfg.CollabPort)
	}
	if cfg.LogLevel != "info" {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, "info")
	}
	if cfg.LogFormat != "console" {
		t.Errorf("LogFormat = %q, want %q", cfg.LogFormat, "console")
	}
	if cfg.KafkaEnabled {
		t.Error("KafkaEnabled should be false by default")
	}
	if cfg.ReadTimeout != 5*time.Second {
		t.Errorf("ReadTimeout = %v, want 5s", cfg.ReadTimeout)
	}
	if cfg.Version != "dev" {
		t.Errorf("Version = %q, want %q", cfg.Version, "dev")
	}
}

func TestLoad_EnvOverrides(t *testing.T) {
	os.Setenv("GRPC_PORT", "9999")
	os.Setenv("LOG_LEVEL", "debug")
	os.Setenv("KAFKA_ENABLED", "true")
	os.Setenv("KAFKA_BROKERS", "broker1:9092,broker2:9092")
	os.Setenv("JWT_SECRET", "test-secret")
	defer func() {
		os.Unsetenv("GRPC_PORT")
		os.Unsetenv("LOG_LEVEL")
		os.Unsetenv("KAFKA_ENABLED")
		os.Unsetenv("KAFKA_BROKERS")
		os.Unsetenv("JWT_SECRET")
	}()

	cfg := Load()

	if cfg.GRPCPort != 9999 {
		t.Errorf("GRPCPort = %d, want 9999", cfg.GRPCPort)
	}
	if cfg.LogLevel != "debug" {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, "debug")
	}
	if !cfg.KafkaEnabled {
		t.Error("KafkaEnabled should be true")
	}
	if len(cfg.KafkaBrokers) != 2 {
		t.Errorf("KafkaBrokers len = %d, want 2", len(cfg.KafkaBrokers))
	}
	if cfg.JWTSecret != "test-secret" {
		t.Errorf("JWTSecret = %q, want %q", cfg.JWTSecret, "test-secret")
	}
}

func TestLoad_DefaultsWhenNoEnv(t *testing.T) {
	os.Unsetenv("GRPC_PORT")
	os.Unsetenv("LOG_LEVEL")
	os.Unsetenv("KAFKA_ENABLED")

	cfg := Load()

	if cfg.GRPCPort != 50051 {
		t.Errorf("GRPCPort = %d, want 50051", cfg.GRPCPort)
	}
	if cfg.LogLevel != "info" {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, "info")
	}
}

func TestGRPCAddr(t *testing.T) {
	cfg := &Config{GRPCHost: "0.0.0.0", GRPCPort: 50051}
	if got := cfg.GRPCAddr(); got != "0.0.0.0:50051" {
		t.Errorf("GRPCAddr() = %q, want %q", got, "0.0.0.0:50051")
	}
}

func TestHealthAddr(t *testing.T) {
	cfg := &Config{HealthPort: 50052}
	if got := cfg.HealthAddr(); got != ":50052" {
		t.Errorf("HealthAddr() = %q, want %q", got, ":50052")
	}
}

func TestCollabAddr(t *testing.T) {
	cfg := &Config{CollabPort: 8765}
	if got := cfg.CollabAddr(); got != ":8765" {
		t.Errorf("CollabAddr() = %q, want %q", got, ":8765")
	}
}

func TestLoad_InvalidEnvFallback(t *testing.T) {
	os.Setenv("GRPC_PORT", "not-a-number")
	defer os.Unsetenv("GRPC_PORT")

	cfg := Load()
	if cfg.GRPCPort != 50051 {
		t.Errorf("GRPCPort = %d, want 50051 (fallback on invalid)", cfg.GRPCPort)
	}
}
