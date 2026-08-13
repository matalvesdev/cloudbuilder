package plugin

import (
	"context"
)

// PluginType identifies the kind of plugin.
type PluginType string

const (
	PluginExecutor PluginType = "executor"
	PluginProvider PluginType = "provider"
	PluginHook     PluginType = "hook"
	PluginPolicy   PluginType = "policy"
	PluginResource PluginType = "resource"
)

// PluginInfo describes a plugin's metadata.
type PluginInfo struct {
	Name        string     `json:"name"`
	Version     string     `json:"version"`
	Type        PluginType `json:"type"`
	Author      string     `json:"author"`
	Description string     `json:"description,omitempty"`
}

// Plugin is the base interface for all plugins.
type Plugin interface {
	Info() PluginInfo
	Init(config map[string]string) error
	Shutdown() error
	HealthCheck(ctx context.Context) error
}
