package config

import (
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

// NewLogger creates a zerolog.Logger configured from the Config.
// LogFormat "json" produces machine-parseable logs (production).
// LogFormat "console" produces human-readable colored output (development).
func NewLogger(cfg *Config) zerolog.Logger {
	var level zerolog.Level
	switch strings.ToLower(cfg.LogLevel) {
	case "debug":
		level = zerolog.DebugLevel
	case "warn":
		level = zerolog.WarnLevel
	case "error":
		level = zerolog.ErrorLevel
	default:
		level = zerolog.InfoLevel
	}

	zerolog.SetGlobalLevel(level)

	var logger zerolog.Logger
	if cfg.LogFormat == "json" {
		logger = zerolog.New(os.Stdout).With().
			Timestamp().
			Str("service", "provision-engine").
			Logger()
	} else {
		output := zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		}
		logger = zerolog.New(output).With().
			Timestamp().
			Str("service", "provision-engine").
			Logger()
	}

	return logger
}
