package grpc

import (
	"context"
	"testing"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/api/grpc/proto"
	"github.com/cloudbuilder/provision-engine/internal/domain/audit"
	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
	"github.com/cloudbuilder/provision-engine/internal/domain/execution"
	"github.com/cloudbuilder/provision-engine/internal/domain/provider"
	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
	"github.com/cloudbuilder/provision-engine/internal/domain/state"
	"github.com/cloudbuilder/provision-engine/internal/domain/workflow"
)

// ─── Mock Repositories ─────────────────────────────────────────────────

type mockDepRepo struct{ data map[string]*deployment.Deployment }

func newMockDepRepo() *mockDepRepo {
	return &mockDepRepo{data: make(map[string]*deployment.Deployment)}
}

func (m *mockDepRepo) Create(_ context.Context, d *deployment.Deployment) error {
	m.data[d.ID] = d
	return nil
}
func (m *mockDepRepo) GetByID(_ context.Context, id string) (*deployment.Deployment, error) {
	if d, ok := m.data[id]; ok {
		return d, nil
	}
	return nil, shared.ErrNotFound("Deployment", id)
}
func (m *mockDepRepo) Update(_ context.Context, d *deployment.Deployment) error {
	m.data[d.ID] = d
	return nil
}
func (m *mockDepRepo) Delete(_ context.Context, id string) error {
	delete(m.data, id)
	return nil
}
func (m *mockDepRepo) List(_ context.Context, tenantID string, _ deployment.DeploymentFilter) ([]*deployment.Deployment, int, error) {
	var result []*deployment.Deployment
	for _, d := range m.data {
		if d.TenantID == tenantID {
			result = append(result, d)
		}
	}
	return result, len(result), nil
}
func (m *mockDepRepo) GetByStatus(_ context.Context, _ deployment.DeploymentStatus) ([]*deployment.Deployment, error) {
	return nil, nil
}
func (m *mockDepRepo) CountByTenant(_ context.Context, _ string) (int, error) { return 0, nil }

type mockWfRepo struct{ data map[string]*workflow.Workflow }

func newMockWfRepo() *mockWfRepo {
	return &mockWfRepo{data: make(map[string]*workflow.Workflow)}
}

func (m *mockWfRepo) Create(_ context.Context, wf *workflow.Workflow) error {
	m.data[wf.ID] = wf
	return nil
}
func (m *mockWfRepo) GetByID(_ context.Context, id string) (*workflow.Workflow, error) {
	if wf, ok := m.data[id]; ok {
		return wf, nil
	}
	return nil, shared.ErrNotFound("Workflow", id)
}
func (m *mockWfRepo) Update(_ context.Context, wf *workflow.Workflow) error {
	m.data[wf.ID] = wf
	return nil
}
func (m *mockWfRepo) GetByDeploymentID(_ context.Context, depID string) (*workflow.Workflow, error) {
	for _, wf := range m.data {
		if wf.DeploymentID == depID {
			return wf, nil
		}
	}
	return nil, shared.ErrNotFound("Workflow", depID)
}
func (m *mockWfRepo) ListByStatus(_ context.Context, _ workflow.WorkflowStatus) ([]*workflow.Workflow, error) {
	return nil, nil
}

type mockExecRepo struct{ data map[string]*execution.Execution }

func newMockExecRepo() *mockExecRepo {
	return &mockExecRepo{data: make(map[string]*execution.Execution)}
}

func (m *mockExecRepo) Create(_ context.Context, e *execution.Execution) error {
	m.data[e.ID] = e
	return nil
}
func (m *mockExecRepo) GetByID(_ context.Context, id string) (*execution.Execution, error) {
	if e, ok := m.data[id]; ok {
		return e, nil
	}
	return nil, shared.ErrNotFound("Execution", id)
}
func (m *mockExecRepo) Update(_ context.Context, e *execution.Execution) error {
	m.data[e.ID] = e
	return nil
}
func (m *mockExecRepo) ListByWorkflowID(_ context.Context, wfID string) ([]*execution.Execution, error) {
	var result []*execution.Execution
	for _, e := range m.data {
		if e.WorkflowID == wfID {
			result = append(result, e)
		}
	}
	return result, nil
}
func (m *mockExecRepo) ListByStatus(_ context.Context, _ execution.ExecutionStatus) ([]*execution.Execution, error) {
	return nil, nil
}

type mockResRepo struct{ data map[string]*resource.ManagedResource }

func newMockResRepo() *mockResRepo {
	return &mockResRepo{data: make(map[string]*resource.ManagedResource)}
}

func (m *mockResRepo) Create(_ context.Context, r *resource.ManagedResource) error {
	m.data[r.ID] = r
	return nil
}
func (m *mockResRepo) GetByID(_ context.Context, id string) (*resource.ManagedResource, error) {
	if r, ok := m.data[id]; ok {
		return r, nil
	}
	return nil, shared.ErrNotFound("Resource", id)
}
func (m *mockResRepo) GetByAddress(_ context.Context, addr string) (*resource.ManagedResource, error) {
	for _, r := range m.data {
		if r.Address == addr {
			return r, nil
		}
	}
	return nil, shared.ErrNotFound("Resource", addr)
}
func (m *mockResRepo) Update(_ context.Context, r *resource.ManagedResource) error {
	m.data[r.ID] = r
	return nil
}
func (m *mockResRepo) Delete(_ context.Context, id string) error {
	delete(m.data, id)
	return nil
}
func (m *mockResRepo) ListByDeploymentID(_ context.Context, depID string) ([]*resource.ManagedResource, error) {
	var result []*resource.ManagedResource
	for _, r := range m.data {
		if r.DeploymentID == depID {
			result = append(result, r)
		}
	}
	return result, nil
}
func (m *mockResRepo) ListByProvider(_ context.Context, _, _ string) ([]*resource.ManagedResource, error) {
	return nil, nil
}
func (m *mockResRepo) ListByState(_ context.Context, st resource.ResourceState) ([]*resource.ManagedResource, error) {
	var result []*resource.ManagedResource
	for _, r := range m.data {
		if r.State == st {
			result = append(result, r)
		}
	}
	return result, nil
}
func (m *mockResRepo) CountByTenant(_ context.Context, _ string) (int, error) { return 0, nil }

type mockStateRepo struct{ data map[string]*state.StateEntry }

func newMockStateRepo() *mockStateRepo {
	return &mockStateRepo{data: make(map[string]*state.StateEntry)}
}

func (m *mockStateRepo) Create(_ context.Context, s *state.StateEntry) error {
	m.data[s.ID] = s
	return nil
}
func (m *mockStateRepo) GetByID(_ context.Context, id string) (*state.StateEntry, error) {
	if s, ok := m.data[id]; ok {
		return s, nil
	}
	return nil, shared.ErrNotFound("State", id)
}
func (m *mockStateRepo) GetByResourceID(_ context.Context, resID string) (*state.StateEntry, error) {
	for _, s := range m.data {
		if s.ResourceID == resID {
			return s, nil
		}
	}
	return nil, shared.ErrNotFound("State", resID)
}
func (m *mockStateRepo) Update(_ context.Context, s *state.StateEntry) error {
	m.data[s.ID] = s
	return nil
}
func (m *mockStateRepo) GetVersion(_ context.Context, _ string, _ int) (*state.StateEntry, error) {
	return nil, nil
}
func (m *mockStateRepo) ListVersions(_ context.Context, _ string) ([]state.StateVersion, error) {
	return nil, nil
}
func (m *mockStateRepo) ListByStatus(_ context.Context, _ state.StateStatus) ([]*state.StateEntry, error) {
	return nil, nil
}

type mockProvRepo struct{ data map[string]*provider.Provider }

func newMockProvRepo() *mockProvRepo {
	return &mockProvRepo{data: make(map[string]*provider.Provider)}
}

func (m *mockProvRepo) Create(_ context.Context, p *provider.Provider) error {
	m.data[p.ID] = p
	return nil
}
func (m *mockProvRepo) GetByID(_ context.Context, id string) (*provider.Provider, error) {
	if p, ok := m.data[id]; ok {
		return p, nil
	}
	return nil, shared.ErrNotFound("Provider", id)
}
func (m *mockProvRepo) GetByTypeAndTenant(_ context.Context, _ string, _ provider.ProviderType) (*provider.Provider, error) {
	return nil, shared.ErrNotFound("Provider", "")
}
func (m *mockProvRepo) Update(_ context.Context, p *provider.Provider) error {
	m.data[p.ID] = p
	return nil
}
func (m *mockProvRepo) Delete(_ context.Context, id string) error {
	delete(m.data, id)
	return nil
}
func (m *mockProvRepo) ListByTenant(_ context.Context, tenantID string) ([]*provider.Provider, error) {
	var result []*provider.Provider
	for _, p := range m.data {
		if p.TenantID == tenantID {
			result = append(result, p)
		}
	}
	return result, nil
}

type mockAuditRepo struct{ data map[string]*audit.AuditEvent }

func newMockAuditRepo() *mockAuditRepo {
	return &mockAuditRepo{data: make(map[string]*audit.AuditEvent)}
}

func (m *mockAuditRepo) Create(_ context.Context, e *audit.AuditEvent) error {
	m.data[e.ID] = e
	return nil
}
func (m *mockAuditRepo) GetByID(_ context.Context, id string) (*audit.AuditEvent, error) {
	if e, ok := m.data[id]; ok {
		return e, nil
	}
	return nil, shared.ErrNotFound("AuditEvent", id)
}
func (m *mockAuditRepo) ListByTenant(_ context.Context, tenantID string, _ audit.AuditFilter) ([]*audit.AuditEvent, int, error) {
	var result []*audit.AuditEvent
	for _, e := range m.data {
		if e.TenantID == tenantID {
			result = append(result, e)
		}
	}
	return result, len(result), nil
}
func (m *mockAuditRepo) ListByResource(_ context.Context, _, _ string) ([]*audit.AuditEvent, error) {
	return nil, nil
}

func newTestServer() *Server {
	return NewServer(
		newMockDepRepo(),
		newMockWfRepo(),
		newMockExecRepo(),
		newMockResRepo(),
		newMockStateRepo(),
		newMockProvRepo(),
		newMockAuditRepo(),
	)
}

// ═══════════════════════════════════════════════════════════════════════════
// Deployment Tests
// ═══════════════════════════════════════════════════════════════════════════

func TestCreateDeployment(t *testing.T) {
	s := newTestServer()
	resp, err := s.CreateDeployment(context.Background(), &proto.CreateDeploymentRequest{
		TenantID: "tenant-1",
		Name:     "test-deploy",
		Config: &proto.DeploymentConfig{
			ExecutorType: "terraform",
			ProviderType: "aws",
		},
	})
	if err != nil {
		t.Fatalf("CreateDeployment() error = %v", err)
	}
	if resp.Deployment == nil {
		t.Fatal("expected deployment")
	}
	if resp.Deployment.Name != "test-deploy" {
		t.Errorf("Name = %q, want %q", resp.Deployment.Name, "test-deploy")
	}
	if resp.Deployment.Status != proto.DeploymentStatusPending {
		t.Errorf("Status = %q, want %q", resp.Deployment.Status, proto.DeploymentStatusPending)
	}
}

func TestCreateDeployment_InvalidArgs(t *testing.T) {
	s := newTestServer()
	_, err := s.CreateDeployment(context.Background(), &proto.CreateDeploymentRequest{})
	if err == nil {
		t.Fatal("expected error for empty request")
	}
}

func TestGetDeployment(t *testing.T) {
	s := newTestServer()
	dep := createTestDep("dep-1")
	s.deploymentRepo.(*mockDepRepo).data["dep-1"] = dep

	resp, err := s.GetDeployment(context.Background(), &proto.GetDeploymentRequest{ID: "dep-1"})
	if err != nil {
		t.Fatalf("GetDeployment() error = %v", err)
	}
	if resp.Deployment.Name != "test-deploy" {
		t.Errorf("Name = %q, want %q", resp.Deployment.Name, "test-deploy")
	}
}

func TestGetDeployment_NotFound(t *testing.T) {
	s := newTestServer()
	_, err := s.GetDeployment(context.Background(), &proto.GetDeploymentRequest{ID: "nonexistent"})
	if err == nil {
		t.Fatal("expected error for nonexistent deployment")
	}
}

func TestListDeployments(t *testing.T) {
	s := newTestServer()
	s.deploymentRepo.(*mockDepRepo).data["dep-1"] = createTestDep("dep-1")
	s.deploymentRepo.(*mockDepRepo).data["dep-2"] = createTestDep("dep-2")

	resp, err := s.ListDeployments(context.Background(), &proto.ListDeploymentsRequest{TenantID: "tenant-1"})
	if err != nil {
		t.Fatalf("ListDeployments() error = %v", err)
	}
	if len(resp.Deployments) != 2 {
		t.Errorf("expected 2 deployments, got %d", len(resp.Deployments))
	}
}

func TestSubmitDeployment(t *testing.T) {
	s := newTestServer()
	dep := createTestDep("dep-1")
	s.deploymentRepo.(*mockDepRepo).data["dep-1"] = dep

	resp, err := s.SubmitDeployment(context.Background(), &proto.SubmitDeploymentRequest{ID: "dep-1"})
	if err != nil {
		t.Fatalf("SubmitDeployment() error = %v", err)
	}
	if resp.Deployment.Status != proto.DeploymentStatusPlanning {
		t.Errorf("Status = %q, want %q", resp.Deployment.Status, proto.DeploymentStatusPlanning)
	}
}

func TestCancelDeployment(t *testing.T) {
	s := newTestServer()
	dep := createTestDep("dep-1")
	s.deploymentRepo.(*mockDepRepo).data["dep-1"] = dep

	resp, err := s.CancelDeployment(context.Background(), &proto.CancelDeploymentRequest{ID: "dep-1", Reason: "test"})
	if err != nil {
		t.Fatalf("CancelDeployment() error = %v", err)
	}
	if resp.Deployment.Status != proto.DeploymentStatusCancelled {
		t.Errorf("Status = %q, want %q", resp.Deployment.Status, proto.DeploymentStatusCancelled)
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Workflow Tests
// ═══════════════════════════════════════════════════════════════════════════

func TestGetWorkflow(t *testing.T) {
	s := newTestServer()
	wf := createTestWf("wf-1", "dep-1")
	s.workflowRepo.(*mockWfRepo).data["wf-1"] = wf

	resp, err := s.GetWorkflow(context.Background(), &proto.GetWorkflowRequest{ID: "wf-1"})
	if err != nil {
		t.Fatalf("GetWorkflow() error = %v", err)
	}
	if resp.Workflow.ID != "wf-1" {
		t.Errorf("ID = %q, want %q", resp.Workflow.ID, "wf-1")
	}
}

func TestListWorkflowSteps(t *testing.T) {
	s := newTestServer()
	wf := createTestWf("wf-1", "dep-1")
	s.workflowRepo.(*mockWfRepo).data["wf-1"] = wf

	resp, err := s.ListWorkflowSteps(context.Background(), &proto.ListWorkflowStepsRequest{WorkflowID: "wf-1"})
	if err != nil {
		t.Fatalf("ListWorkflowSteps() error = %v", err)
	}
	if len(resp.Steps) != 2 {
		t.Errorf("expected 2 steps, got %d", len(resp.Steps))
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Resource Tests
// ═══════════════════════════════════════════════════════════════════════════

func TestCreateResource(t *testing.T) {
	s := newTestServer()
	resp, err := s.CreateResource(context.Background(), &proto.CreateResourceRequest{
		DeploymentID: "dep-1",
		Provider:     "aws",
		Type:         "aws_vpc",
		Name:         "main-vpc",
	})
	if err != nil {
		t.Fatalf("CreateResource() error = %v", err)
	}
	if resp.Resource == nil {
		t.Fatal("expected resource")
	}
	if resp.Resource.Name != "main-vpc" {
		t.Errorf("Name = %q, want %q", resp.Resource.Name, "main-vpc")
	}
}

func TestGetResource(t *testing.T) {
	s := newTestServer()
	res := createTestRes("res-1", "dep-1")
	s.resourceRepo.(*mockResRepo).data["res-1"] = res

	resp, err := s.GetResource(context.Background(), &proto.GetResourceRequest{ID: "res-1"})
	if err != nil {
		t.Fatalf("GetResource() error = %v", err)
	}
	if resp.Resource.Name != "main-vpc" {
		t.Errorf("Name = %q, want %q", resp.Resource.Name, "main-vpc")
	}
}

func TestListResources(t *testing.T) {
	s := newTestServer()
	s.resourceRepo.(*mockResRepo).data["res-1"] = createTestRes("res-1", "dep-1")

	resp, err := s.ListResources(context.Background(), &proto.ListResourcesRequest{DeploymentID: "dep-1"})
	if err != nil {
		t.Fatalf("ListResources() error = %v", err)
	}
	if len(resp.Resources) != 1 {
		t.Errorf("expected 1 resource, got %d", len(resp.Resources))
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Provider Tests
// ═══════════════════════════════════════════════════════════════════════════

func TestRegisterProvider(t *testing.T) {
	s := newTestServer()
	resp, err := s.RegisterProvider(context.Background(), &proto.RegisterProviderRequest{
		TenantID: "tenant-1",
		Type:     "aws",
		Name:     "aws-prod",
		Config:   map[string]string{"region": "us-east-1"},
	})
	if err != nil {
		t.Fatalf("RegisterProvider() error = %v", err)
	}
	if resp.Provider.Name != "aws-prod" {
		t.Errorf("Name = %q, want %q", resp.Provider.Name, "aws-prod")
	}
}

func TestGetProvider(t *testing.T) {
	s := newTestServer()
	prov := createTestProv("prov-1")
	s.providerRepo.(*mockProvRepo).data["prov-1"] = prov

	resp, err := s.GetProvider(context.Background(), &proto.GetProviderRequest{ID: "prov-1"})
	if err != nil {
		t.Fatalf("GetProvider() error = %v", err)
	}
	if resp.Provider.Name != "aws-prod" {
		t.Errorf("Name = %q, want %q", resp.Provider.Name, "aws-prod")
	}
}

func TestListProviders(t *testing.T) {
	s := newTestServer()
	s.providerRepo.(*mockProvRepo).data["prov-1"] = createTestProv("prov-1")

	resp, err := s.ListProviders(context.Background(), &proto.ListProvidersRequest{TenantID: "tenant-1"})
	if err != nil {
		t.Fatalf("ListProviders() error = %v", err)
	}
	if len(resp.Providers) != 1 {
		t.Errorf("expected 1 provider, got %d", len(resp.Providers))
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Audit Tests
// ═══════════════════════════════════════════════════════════════════════════

func TestListAuditEvents(t *testing.T) {
	s := newTestServer()
	event := createTestAudit("audit-1")
	s.auditRepo.(*mockAuditRepo).data["audit-1"] = event

	resp, err := s.ListAuditEvents(context.Background(), &proto.ListAuditEventsRequest{TenantID: "tenant-1"})
	if err != nil {
		t.Fatalf("ListAuditEvents() error = %v", err)
	}
	if len(resp.Events) != 1 {
		t.Errorf("expected 1 event, got %d", len(resp.Events))
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

func createTestDep(id string) *deployment.Deployment {
	d := &deployment.Deployment{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		TenantID: "tenant-1",
		Name:     "test-deploy",
		Status:   deployment.StatusPending,
		Config: deployment.DeploymentConfig{
			ExecutorType: "terraform",
			ProviderType: "aws",
		},
		Metadata: make(map[string]string),
	}
	return d
}

func createTestWf(id, depID string) *workflow.Workflow {
	return &workflow.Workflow{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		DeploymentID: depID,
		Status:       workflow.WStatusPending,
		Steps: []workflow.WorkflowStep{
			{ID: "step-1", Name: "Create VPC", Type: workflow.StepTypeCreate, Status: workflow.SStatusPending},
			{ID: "step-2", Name: "Create Subnet", Type: workflow.StepTypeCreate, Status: workflow.SStatusPending, DependsOn: []string{"step-1"}},
		},
	}
}

func createTestRes(id, depID string) *resource.ManagedResource {
	return &resource.ManagedResource{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		DeploymentID: depID,
		TenantID:     "tenant-1",
		Provider:     "aws",
		Type:         "aws_vpc",
		Name:         "main-vpc",
		State:        resource.RStateActive,
		Config:       make(map[string]interface{}),
		Dependencies: []string{},
		Metadata:     make(map[string]string),
	}
}

func createTestProv(id string) *provider.Provider {
	return &provider.Provider{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		TenantID:     "tenant-1",
		Type:         provider.ProviderAWS,
		Name:         "aws-prod",
		Status:       provider.ProviderStatusHealthy,
		Config:       map[string]string{"region": "us-east-1"},
		Capabilities: []provider.ProviderCapability{provider.CapProvision},
	}
}

func createTestAudit(id string) *audit.AuditEvent {
	return &audit.AuditEvent{
		AggregateRoot: shared.AggregateRoot{
			ID:        id,
			Version:   1,
			CreatedAt: time.Now().UTC(),
			UpdatedAt: time.Now().UTC(),
		},
		TenantID:     "tenant-1",
		UserID:       "user-1",
		Action:       "deployment.created",
		ResourceType: "Deployment",
		ResourceID:   "dep-1",
		Details:      make(map[string]interface{}),
	}
}
