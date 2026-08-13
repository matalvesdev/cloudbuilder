// Package app wires all dependencies together.
package app

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/api/rest"
	"github.com/cloudbuilder/provision-engine/internal/domain/audit"
	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
	"github.com/cloudbuilder/provision-engine/internal/domain/execution"
	"github.com/cloudbuilder/provision-engine/internal/domain/provider"
	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
	"github.com/cloudbuilder/provision-engine/internal/domain/state"
	"github.com/cloudbuilder/provision-engine/internal/domain/workflow"
	"github.com/cloudbuilder/provision-engine/internal/infrastructure/postgres"
)

// Config holds application configuration.
type Config struct {
	HTTPAddr     string
	GRPCAddr     string
	DatabaseHost string
	DatabasePort int
	DatabaseName string
	DatabaseUser string
	DatabasePass string
	JWTSecret    string
	CORSOrigin   string
}

// DefaultConfig returns sensible defaults.
func DefaultConfig() *Config {
	return &Config{
		HTTPAddr:     ":8080",
		GRPCAddr:     ":9090",
		DatabaseHost: "localhost",
		DatabasePort: 5432,
		DatabaseName: "provision_engine",
		DatabaseUser: "pe",
		DatabasePass: "pe_secret",
		CORSOrigin:   "http://localhost:3000",
	}
}

// App holds all wired dependencies.
type App struct {
	Config         *Config
	DB             *postgres.DB
	DeploymentRepo deployment.Repository
	WorkflowRepo   workflow.Repository
	ExecutionRepo  execution.Repository
	ResourceRepo   resource.Repository
	StateRepo      state.Repository
	ProviderRepo   provider.Repository
	AuditRepo      audit.Repository
	DeploymentSvc  *deployment.Service
	WorkflowSvc    *workflow.Service
	ExecutionSvc   *execution.Service
	ResourceSvc    *resource.Service
	StateSvc       *state.Service
	RESTServer     *rest.Server
}

// New creates a new wired App.
func New(cfg *Config) (*App, error) {
	if cfg == nil {
		cfg = DefaultConfig()
	}
	if len(cfg.JWTSecret) < 32 {
		return nil, fmt.Errorf("JWT secret with at least 32 bytes is required")
	}

	// Database
	dbCfg := postgres.Config{
		Host:         cfg.DatabaseHost,
		Port:         cfg.DatabasePort,
		Database:     cfg.DatabaseName,
		Username:     cfg.DatabaseUser,
		Password:     cfg.DatabasePass,
		MaxOpenConns: 25,
		MaxIdleConns: 10,
		MaxLifetime:  5 * time.Minute,
	}
	db, err := postgres.New(dbCfg)
	if err != nil {
		return nil, fmt.Errorf("connect database: %w", err)
	}

	// Repositories
	depRepo := postgres.NewDeploymentRepository(db)
	wfRepo := postgres.NewWorkflowRepository(db)
	execRepo := postgres.NewExecutionRepository(db)
	resRepo := postgres.NewResourceRepository(db)
	stateRepo := postgres.NewStateRepository(db)
	provRepo := postgres.NewProviderRepository(db)
	auditRepo := postgres.NewAuditRepository(db)

	// Domain services
	depSvc := deployment.NewService(depRepo)
	wfSvc := workflow.NewService(wfRepo)
	execSvc := execution.NewService(execRepo)
	resSvc := resource.NewService(resRepo)
	stateSvc := state.NewService(stateRepo)

	// REST server
	serverCfg := rest.DefaultServerConfig()
	serverCfg.Addr = cfg.HTTPAddr
	serverCfg.JWTSecret = cfg.JWTSecret
	serverCfg.AuthEnabled = true
	serverCfg.CORSAllowOrigin = cfg.CORSOrigin
	restServer := rest.NewServer(serverCfg)

	// Register health checks
	restServer.Health().Register("database", func(ctx context.Context) error {
		return db.PingContext(ctx)
	})

	// Register domain handlers on the mux
	mux := restServer.Mux()
	rest.NewDeploymentHandler(depRepo).RegisterRoutes(mux)
	rest.NewWorkflowHandler(wfRepo, depRepo).RegisterRoutes(mux)
	rest.NewExecutionHandler(execRepo, wfRepo, depRepo).RegisterRoutes(mux)
	rest.NewResourceHandler(resRepo).RegisterRoutes(mux)
	rest.NewStateHandler(stateRepo, resRepo).RegisterRoutes(mux)
	rest.NewProviderHandler(provRepo).RegisterRoutes(mux)
	rest.NewDriftHandler(resRepo, stateRepo).RegisterRoutes(mux)
	rest.NewAuditHandler(auditRepo).RegisterRoutes(mux)

	return &App{
		Config:         cfg,
		DB:             db,
		DeploymentRepo: depRepo,
		WorkflowRepo:   wfRepo,
		ExecutionRepo:  execRepo,
		ResourceRepo:   resRepo,
		StateRepo:      stateRepo,
		ProviderRepo:   provRepo,
		AuditRepo:      auditRepo,
		DeploymentSvc:  depSvc,
		WorkflowSvc:    wfSvc,
		ExecutionSvc:   execSvc,
		ResourceSvc:    resSvc,
		StateSvc:       stateSvc,
		RESTServer:     restServer,
	}, nil
}

// Close shuts down the application.
func (a *App) Close() error {
	if a.DB != nil {
		return a.DB.Close()
	}
	return nil
}

// ─── Test Mode ──────────────────────────────────────────────────────────

// NewTest creates an App with in-memory mocks for testing without a database.
func NewTest(cfg *Config) *App {
	if cfg == nil {
		cfg = DefaultConfig()
	}

	serverCfg := rest.DefaultServerConfig()
	serverCfg.Addr = cfg.HTTPAddr
	serverCfg.JWTSecret = cfg.JWTSecret
	serverCfg.AuthEnabled = cfg.JWTSecret != ""
	serverCfg.CORSAllowOrigin = cfg.CORSOrigin
	restServer := rest.NewServer(serverCfg)

	// In-memory stores for testing
	depStore := &memDeploymentStore{data: make(map[string]*deployment.Deployment)}
	wfStore := &memWorkflowStore{data: make(map[string]*workflow.Workflow)}
	execStore := &memExecutionStore{data: make(map[string]*execution.Execution)}
	resStore := &memResourceStore{data: make(map[string]*resource.ManagedResource)}
	stateStore := &memStateStore{data: make(map[string]*state.StateEntry)}
	provStore := &memProviderStore{data: make(map[string]*provider.Provider)}
	auditStore := &memAuditStore{data: make(map[string]*audit.AuditEvent)}

	// Register health check
	restServer.Health().Register("database", func(ctx context.Context) error { return nil })

	// Register handlers
	mux := restServer.Mux()
	rest.NewDeploymentHandler(depStore).RegisterRoutes(mux)
	rest.NewWorkflowHandler(wfStore, depStore).RegisterRoutes(mux)
	rest.NewExecutionHandler(execStore, wfStore, depStore).RegisterRoutes(mux)
	rest.NewResourceHandler(resStore).RegisterRoutes(mux)
	rest.NewStateHandler(stateStore, resStore).RegisterRoutes(mux)
	rest.NewProviderHandler(provStore).RegisterRoutes(mux)
	rest.NewDriftHandler(resStore, stateStore).RegisterRoutes(mux)
	rest.NewAuditHandler(auditStore).RegisterRoutes(mux)

	return &App{
		Config:         cfg,
		DeploymentRepo: depStore,
		WorkflowRepo:   wfStore,
		ExecutionRepo:  execStore,
		ResourceRepo:   resStore,
		StateRepo:      stateStore,
		ProviderRepo:   provStore,
		AuditRepo:      auditStore,
		RESTServer:     restServer,
	}
}

// ─── In-Memory Stores for Testing ───────────────────────────────────────

type memDeploymentStore struct {
	mu   sync.Mutex
	data map[string]*deployment.Deployment
}

func (m *memDeploymentStore) Create(ctx context.Context, d *deployment.Deployment) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[d.ID] = d
	return nil
}
func (m *memDeploymentStore) GetByID(ctx context.Context, id string) (*deployment.Deployment, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if d, ok := m.data[id]; ok {
		return d, nil
	}
	return nil, shared.ErrNotFound("Deployment", id)
}
func (m *memDeploymentStore) Update(ctx context.Context, d *deployment.Deployment) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[d.ID] = d
	return nil
}
func (m *memDeploymentStore) Delete(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.data, id)
	return nil
}
func (m *memDeploymentStore) List(ctx context.Context, tenantID string, filter deployment.DeploymentFilter) ([]*deployment.Deployment, int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var result []*deployment.Deployment
	for _, d := range m.data {
		if d.TenantID == tenantID {
			result = append(result, d)
		}
	}
	return result, len(result), nil
}
func (m *memDeploymentStore) GetByStatus(ctx context.Context, status deployment.DeploymentStatus) ([]*deployment.Deployment, error) {
	return nil, nil
}
func (m *memDeploymentStore) CountByTenant(ctx context.Context, tenantID string) (int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	c := 0
	for _, d := range m.data {
		if d.TenantID == tenantID {
			c++
		}
	}
	return c, nil
}

type memWorkflowStore struct {
	mu   sync.Mutex
	data map[string]*workflow.Workflow
}

func (m *memWorkflowStore) Create(ctx context.Context, wf *workflow.Workflow) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[wf.ID] = wf
	return nil
}
func (m *memWorkflowStore) GetByID(ctx context.Context, id string) (*workflow.Workflow, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if wf, ok := m.data[id]; ok {
		return wf, nil
	}
	return nil, shared.ErrNotFound("Workflow", id)
}
func (m *memWorkflowStore) Update(ctx context.Context, wf *workflow.Workflow) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[wf.ID] = wf
	return nil
}
func (m *memWorkflowStore) GetByDeploymentID(ctx context.Context, deploymentID string) (*workflow.Workflow, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, wf := range m.data {
		if wf.DeploymentID == deploymentID {
			return wf, nil
		}
	}
	return nil, shared.ErrNotFound("Workflow", deploymentID)
}
func (m *memWorkflowStore) ListByStatus(ctx context.Context, status workflow.WorkflowStatus) ([]*workflow.Workflow, error) {
	return nil, nil
}

type memExecutionStore struct {
	mu   sync.Mutex
	data map[string]*execution.Execution
}

func (m *memExecutionStore) Create(ctx context.Context, e *execution.Execution) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[e.ID] = e
	return nil
}
func (m *memExecutionStore) GetByID(ctx context.Context, id string) (*execution.Execution, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if e, ok := m.data[id]; ok {
		return e, nil
	}
	return nil, shared.ErrNotFound("Execution", id)
}
func (m *memExecutionStore) Update(ctx context.Context, e *execution.Execution) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[e.ID] = e
	return nil
}
func (m *memExecutionStore) ListByWorkflowID(ctx context.Context, workflowID string) ([]*execution.Execution, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var result []*execution.Execution
	for _, e := range m.data {
		if e.WorkflowID == workflowID {
			result = append(result, e)
		}
	}
	return result, nil
}
func (m *memExecutionStore) ListByStatus(ctx context.Context, status execution.ExecutionStatus) ([]*execution.Execution, error) {
	return nil, nil
}

type memResourceStore struct {
	mu   sync.Mutex
	data map[string]*resource.ManagedResource
}

func (m *memResourceStore) Create(ctx context.Context, r *resource.ManagedResource) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[r.ID] = r
	return nil
}
func (m *memResourceStore) GetByID(ctx context.Context, id string) (*resource.ManagedResource, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if r, ok := m.data[id]; ok {
		return r, nil
	}
	return nil, shared.ErrNotFound("Resource", id)
}
func (m *memResourceStore) GetByAddress(ctx context.Context, addr string) (*resource.ManagedResource, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, r := range m.data {
		if r.Address == addr {
			return r, nil
		}
	}
	return nil, shared.ErrNotFound("Resource", addr)
}
func (m *memResourceStore) Update(ctx context.Context, r *resource.ManagedResource) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[r.ID] = r
	return nil
}
func (m *memResourceStore) Delete(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.data, id)
	return nil
}
func (m *memResourceStore) ListByDeploymentID(ctx context.Context, depID string) ([]*resource.ManagedResource, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var result []*resource.ManagedResource
	for _, r := range m.data {
		if r.DeploymentID == depID {
			result = append(result, r)
		}
	}
	return result, nil
}
func (m *memResourceStore) ListByProvider(ctx context.Context, tenantID, provider string) ([]*resource.ManagedResource, error) {
	return nil, nil
}
func (m *memResourceStore) ListByState(ctx context.Context, state resource.ResourceState) ([]*resource.ManagedResource, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var result []*resource.ManagedResource
	for _, r := range m.data {
		if r.State == state {
			result = append(result, r)
		}
	}
	return result, nil
}
func (m *memResourceStore) CountByTenant(ctx context.Context, tenantID string) (int, error) {
	return 0, nil
}

type memStateStore struct {
	mu   sync.Mutex
	data map[string]*state.StateEntry
}

func (m *memStateStore) Create(ctx context.Context, s *state.StateEntry) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[s.ID] = s
	return nil
}
func (m *memStateStore) GetByID(ctx context.Context, id string) (*state.StateEntry, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if s, ok := m.data[id]; ok {
		return s, nil
	}
	return nil, shared.ErrNotFound("State", id)
}
func (m *memStateStore) GetByResourceID(ctx context.Context, resourceID string) (*state.StateEntry, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, s := range m.data {
		if s.ResourceID == resourceID {
			return s, nil
		}
	}
	return nil, shared.ErrNotFound("State", resourceID)
}
func (m *memStateStore) Update(ctx context.Context, s *state.StateEntry) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[s.ID] = s
	return nil
}
func (m *memStateStore) GetVersion(ctx context.Context, resourceID string, version int) (*state.StateEntry, error) {
	return nil, nil
}
func (m *memStateStore) ListVersions(ctx context.Context, resourceID string) ([]state.StateVersion, error) {
	return nil, nil
}
func (m *memStateStore) ListByStatus(ctx context.Context, status state.StateStatus) ([]*state.StateEntry, error) {
	return nil, nil
}

type memProviderStore struct {
	mu   sync.Mutex
	data map[string]*provider.Provider
}

func (m *memProviderStore) Create(ctx context.Context, p *provider.Provider) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[p.ID] = p
	return nil
}
func (m *memProviderStore) GetByID(ctx context.Context, id string) (*provider.Provider, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if p, ok := m.data[id]; ok {
		return p, nil
	}
	return nil, shared.ErrNotFound("Provider", id)
}
func (m *memProviderStore) GetByTypeAndTenant(ctx context.Context, tenantID string, providerType provider.ProviderType) (*provider.Provider, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, p := range m.data {
		if p.TenantID == tenantID && p.Type == providerType {
			return p, nil
		}
	}
	return nil, shared.ErrNotFound("Provider", string(providerType))
}
func (m *memProviderStore) Update(ctx context.Context, p *provider.Provider) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[p.ID] = p
	return nil
}
func (m *memProviderStore) Delete(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.data, id)
	return nil
}
func (m *memProviderStore) ListByTenant(ctx context.Context, tenantID string) ([]*provider.Provider, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var result []*provider.Provider
	for _, p := range m.data {
		if p.TenantID == tenantID {
			result = append(result, p)
		}
	}
	return result, nil
}

type memAuditStore struct {
	mu   sync.Mutex
	data map[string]*audit.AuditEvent
}

func (m *memAuditStore) Create(ctx context.Context, e *audit.AuditEvent) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[e.ID] = e
	return nil
}
func (m *memAuditStore) GetByID(ctx context.Context, id string) (*audit.AuditEvent, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if e, ok := m.data[id]; ok {
		return e, nil
	}
	return nil, shared.ErrNotFound("AuditEvent", id)
}
func (m *memAuditStore) ListByTenant(ctx context.Context, tenantID string, filter audit.AuditFilter) ([]*audit.AuditEvent, int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var result []*audit.AuditEvent
	for _, e := range m.data {
		if e.TenantID == tenantID {
			result = append(result, e)
		}
	}
	return result, len(result), nil
}
func (m *memAuditStore) ListByResource(ctx context.Context, resourceType, resourceID string) ([]*audit.AuditEvent, error) {
	return nil, nil
}
