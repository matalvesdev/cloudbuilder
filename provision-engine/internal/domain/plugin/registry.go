package plugin

import (
	"fmt"
	"sync"
)

// Registry manages plugin registration and lookup.
// It is thread-safe and supports hot-reloading of plugins.
type Registry struct {
	mu        sync.RWMutex
	executors map[ExecutorType]Executor
	providers map[ProviderType]Provider
	hooks     map[HookType][]Hook
	policies  []Policy
}

// NewRegistry creates a new plugin registry.
func NewRegistry() *Registry {
	return &Registry{
		executors: make(map[ExecutorType]Executor),
		providers: make(map[ProviderType]Provider),
		hooks:     make(map[HookType][]Hook),
		policies:  make([]Policy, 0),
	}
}

// ─── Executor Registration ──────────────────────────────────────────────

// RegisterExecutor adds an executor plugin to the registry.
func (r *Registry) RegisterExecutor(e Executor) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.executors[e.Type()] = e
}

// GetExecutor retrieves an executor by type.
func (r *Registry) GetExecutor(t ExecutorType) (Executor, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	e, ok := r.executors[t]
	return e, ok
}

// ListExecutors returns all registered executor types.
func (r *Registry) ListExecutors() []ExecutorType {
	r.mu.RLock()
	defer r.mu.RUnlock()
	types := make([]ExecutorType, 0, len(r.executors))
	for t := range r.executors {
		types = append(types, t)
	}
	return types
}

// ─── Provider Registration ──────────────────────────────────────────────

// RegisterProvider adds a provider plugin to the registry.
func (r *Registry) RegisterProvider(p Provider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.providers[p.Type()] = p
}

// GetProvider retrieves a provider by type.
func (r *Registry) GetProvider(t ProviderType) (Provider, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.providers[t]
	return p, ok
}

// ListProviders returns all registered provider types.
func (r *Registry) ListProviders() []ProviderType {
	r.mu.RLock()
	defer r.mu.RUnlock()
	types := make([]ProviderType, 0, len(r.providers))
	for t := range r.providers {
		types = append(types, t)
	}
	return types
}

// ─── Hook Registration ──────────────────────────────────────────────────

// RegisterHook adds a hook plugin to the registry.
func (r *Registry) RegisterHook(h Hook) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.hooks[h.Type()] = append(r.hooks[h.Type()], h)
}

// GetHooks returns all hooks for a given type.
func (r *Registry) GetHooks(hookType HookType) []Hook {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.hooks[hookType]
}

// ─── Policy Registration ────────────────────────────────────────────────

// RegisterPolicy adds a policy plugin to the registry.
func (r *Registry) RegisterPolicy(p Policy) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.policies = append(r.policies, p)
}

// GetPolicies returns all registered policies.
func (r *Registry) GetPolicies() []Policy {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.policies
}

// ─── Lifecycle ──────────────────────────────────────────────────────────

// InitAll initializes all registered plugins.
func (r *Registry) InitAll(config map[string]map[string]string) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for t, e := range r.executors {
		cfg := config[string(t)]
		if err := e.Init(cfg); err != nil {
			return fmt.Errorf("init executor %s: %w", t, err)
		}
	}

	for t, p := range r.providers {
		cfg := config[string(t)]
		if err := p.Init(cfg); err != nil {
			return fmt.Errorf("init provider %s: %w", t, err)
		}
	}

	for _, hooks := range r.hooks {
		for _, h := range hooks {
			info := h.Info()
			cfg := config[info.Name]
			if err := h.Init(cfg); err != nil {
				return fmt.Errorf("init hook %s: %w", info.Name, err)
			}
		}
	}

	for _, p := range r.policies {
		info := p.Info()
		cfg := config[info.Name]
		if err := p.Init(cfg); err != nil {
			return fmt.Errorf("init policy %s: %w", info.Name, err)
		}
	}

	return nil
}

// ShutdownAll shuts down all registered plugins.
func (r *Registry) ShutdownAll() {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, e := range r.executors {
		_ = e.Shutdown()
	}
	for _, p := range r.providers {
		_ = p.Shutdown()
	}
	for _, hooks := range r.hooks {
		for _, h := range hooks {
			_ = h.Shutdown()
		}
	}
	for _, p := range r.policies {
		_ = p.Shutdown()
	}
}
