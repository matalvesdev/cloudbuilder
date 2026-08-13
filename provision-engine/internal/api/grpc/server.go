// Package grpc implements the gRPC API server.
package grpc

import (
	"context"
	"fmt"
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
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Server holds all gRPC service implementations.
type Server struct {
	deploymentRepo  deployment.Repository
	workflowRepo    workflow.Repository
	executionRepo   execution.Repository
	resourceRepo    resource.Repository
	stateRepo       state.Repository
	providerRepo    provider.Repository
	auditRepo       audit.Repository
}

// NewServer creates a new gRPC server.
func NewServer(
	depRepo deployment.Repository,
	wfRepo workflow.Repository,
	execRepo execution.Repository,
	resRepo resource.Repository,
	stateRepo state.Repository,
	provRepo provider.Repository,
	auditRepo audit.Repository,
) *Server {
	return &Server{
		deploymentRepo: depRepo,
		workflowRepo:   wfRepo,
		executionRepo:  execRepo,
		resourceRepo:   resRepo,
		stateRepo:      stateRepo,
		providerRepo:   provRepo,
		auditRepo:      auditRepo,
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Deployment Service
// ═══════════════════════════════════════════════════════════════════════════

func (s *Server) CreateDeployment(ctx context.Context, req *proto.CreateDeploymentRequest) (*proto.CreateDeploymentResponse, error) {
	if req.TenantID == "" || req.Name == "" || req.Config == nil {
		return nil, status.Error(codes.InvalidArgument, "tenant_id, name, and config are required")
	}

	svc := deployment.NewService(s.deploymentRepo)
	dep, err := svc.Create(ctx, req.TenantID, req.Name, req.Description, deployment.DeploymentConfig{
		ExecutorType: req.Config.ExecutorType,
		ProviderType: req.Config.ProviderType,
		AutoApprove:  req.Config.AutoApprove,
		Variables:    req.Config.Variables,
		WorkDir:      req.Config.WorkspaceDir,
		Tags:         req.Config.Tags,
	})
	if err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.CreateDeploymentResponse{Deployment: toProtoDeployment(dep)}, nil
}

func (s *Server) GetDeployment(ctx context.Context, req *proto.GetDeploymentRequest) (*proto.GetDeploymentResponse, error) {
	dep, err := s.deploymentRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}
	return &proto.GetDeploymentResponse{Deployment: toProtoDeployment(dep)}, nil
}

func (s *Server) ListDeployments(ctx context.Context, req *proto.ListDeploymentsRequest) (*proto.ListDeploymentsResponse, error) {
	tenantID := req.TenantID
	if tenantID == "" {
		tenantID = "default"
	}

	deploys, total, err := s.deploymentRepo.List(ctx, tenantID, deployment.DeploymentFilter{Limit: 50})
	if err != nil {
		return nil, toGRPCError(err)
	}

	result := make([]*proto.Deployment, len(deploys))
	for i, d := range deploys {
		result[i] = toProtoDeployment(d)
	}

	return &proto.ListDeploymentsResponse{
		Deployments: result,
		Pagination: &proto.PaginationResponse{
			TotalCount: int32(total),
		},
	}, nil
}

func (s *Server) UpdateDeployment(ctx context.Context, req *proto.UpdateDeploymentRequest) (*proto.UpdateDeploymentResponse, error) {
	dep, err := s.deploymentRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	if req.Name != "" {
		dep.Name = req.Name
	}
	if req.Description != "" {
		dep.Description = req.Description
	}

	if err := s.deploymentRepo.Update(ctx, dep); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.UpdateDeploymentResponse{Deployment: toProtoDeployment(dep)}, nil
}

func (s *Server) DeleteDeployment(ctx context.Context, req *proto.DeleteDeploymentRequest) (*proto.Deployment, error) {
	dep, err := s.deploymentRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	if err := s.deploymentRepo.Delete(ctx, req.ID); err != nil {
		return nil, toGRPCError(err)
	}

	return toProtoDeployment(dep), nil
}

func (s *Server) SubmitDeployment(ctx context.Context, req *proto.SubmitDeploymentRequest) (*proto.SubmitDeploymentResponse, error) {
	dep, err := s.deploymentRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	if err := dep.Submit(); err != nil {
		return nil, toGRPCError(err)
	}

	if err := s.deploymentRepo.Update(ctx, dep); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.SubmitDeploymentResponse{Deployment: toProtoDeployment(dep)}, nil
}

func (s *Server) ApproveDeployment(ctx context.Context, req *proto.ApproveDeploymentRequest) (*proto.ApproveDeploymentResponse, error) {
	dep, err := s.deploymentRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	if err := dep.Approve(req.ApprovedBy); err != nil {
		return nil, toGRPCError(err)
	}

	if err := s.deploymentRepo.Update(ctx, dep); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.ApproveDeploymentResponse{Deployment: toProtoDeployment(dep)}, nil
}

func (s *Server) CancelDeployment(ctx context.Context, req *proto.CancelDeploymentRequest) (*proto.CancelDeploymentResponse, error) {
	dep, err := s.deploymentRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	if err := dep.Cancel(req.Reason); err != nil {
		return nil, toGRPCError(err)
	}

	if err := s.deploymentRepo.Update(ctx, dep); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.CancelDeploymentResponse{Deployment: toProtoDeployment(dep)}, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// Workflow Service
// ═══════════════════════════════════════════════════════════════════════════

func (s *Server) GetWorkflow(ctx context.Context, req *proto.GetWorkflowRequest) (*proto.GetWorkflowResponse, error) {
	wf, err := s.workflowRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}
	return &proto.GetWorkflowResponse{Workflow: toProtoWorkflow(wf)}, nil
}

func (s *Server) GetWorkflowByDeployment(ctx context.Context, req *proto.GetWorkflowByDeploymentRequest) (*proto.GetWorkflowResponse, error) {
	wf, err := s.workflowRepo.GetByDeploymentID(ctx, req.DeploymentID)
	if err != nil {
		return nil, toGRPCError(err)
	}
	return &proto.GetWorkflowResponse{Workflow: toProtoWorkflow(wf)}, nil
}

func (s *Server) ListWorkflowSteps(ctx context.Context, req *proto.ListWorkflowStepsRequest) (*proto.ListWorkflowStepsResponse, error) {
	wf, err := s.workflowRepo.GetByID(ctx, req.WorkflowID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	steps := make([]*proto.WorkflowStep, len(wf.Steps))
	for i, step := range wf.Steps {
		steps[i] = &proto.WorkflowStep{
			ID:         step.ID,
			Name:       step.Name,
			Type:       string(step.Type),
			ResourceID: step.ResourceID,
			Config:     step.Config,
			DependsOn:  step.DependsOn,
			Status:     proto.WorkflowStepStatus(step.Status),
			RetryMax:   int32(step.RetryMax),
			Timeout:    step.Timeout,
		}
	}

	return &proto.ListWorkflowStepsResponse{Steps: steps}, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// Execution Service
// ═══════════════════════════════════════════════════════════════════════════

func (s *Server) GetExecution(ctx context.Context, req *proto.GetExecutionRequest) (*proto.GetExecutionResponse, error) {
	exec, err := s.executionRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}
	return &proto.GetExecutionResponse{Execution: toProtoExecution(exec)}, nil
}

func (s *Server) ListExecutions(ctx context.Context, req *proto.ListExecutionsRequest) (*proto.ListExecutionsResponse, error) {
	execs, err := s.executionRepo.ListByWorkflowID(ctx, req.WorkflowID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	result := make([]*proto.Execution, len(execs))
	for i, e := range execs {
		result[i] = toProtoExecution(e)
	}

	return &proto.ListExecutionsResponse{
		Executions: result,
		Pagination: &proto.PaginationResponse{TotalCount: int32(len(result))},
	}, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// Resource Service
// ═══════════════════════════════════════════════════════════════════════════

func (s *Server) CreateResource(ctx context.Context, req *proto.CreateResourceRequest) (*proto.CreateResourceResponse, error) {
	if req.DeploymentID == "" || req.Provider == "" || req.Type == "" || req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "deployment_id, provider, type, and name are required")
	}

	tenantID := req.TenantID
	if tenantID == "" {
		tenantID = "default"
	}

	res := resource.NewManagedResource(req.DeploymentID, tenantID, req.Provider, req.Type, req.Name, req.Address, req.Config)
	res.Dependencies = req.Dependencies

	if err := s.resourceRepo.Create(ctx, res); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.CreateResourceResponse{Resource: toProtoResource(res)}, nil
}

func (s *Server) GetResource(ctx context.Context, req *proto.GetResourceRequest) (*proto.GetResourceResponse, error) {
	res, err := s.resourceRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}
	return &proto.GetResourceResponse{Resource: toProtoResource(res)}, nil
}

func (s *Server) ListResources(ctx context.Context, req *proto.ListResourcesRequest) (*proto.ListResourcesResponse, error) {
	if req.DeploymentID == "" {
		return nil, status.Error(codes.InvalidArgument, "deployment_id is required")
	}

	resources, err := s.resourceRepo.ListByDeploymentID(ctx, req.DeploymentID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	result := make([]*proto.ManagedResource, len(resources))
	for i, r := range resources {
		result[i] = toProtoResource(r)
	}

	return &proto.ListResourcesResponse{
		Resources: result,
		Pagination: &proto.PaginationResponse{TotalCount: int32(len(result))},
	}, nil
}

func (s *Server) DeleteResource(ctx context.Context, req *proto.DeleteResourceRequest) (*proto.ManagedResource, error) {
	res, err := s.resourceRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	if err := s.resourceRepo.Delete(ctx, req.ID); err != nil {
		return nil, toGRPCError(err)
	}

	return toProtoResource(res), nil
}

// ═══════════════════════════════════════════════════════════════════════════
// State Service
// ═══════════════════════════════════════════════════════════════════════════

func (s *Server) GetState(ctx context.Context, req *proto.GetStateRequest) (*proto.GetStateResponse, error) {
	st, err := s.stateRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}
	return &proto.GetStateResponse{State: toProtoState(st)}, nil
}

func (s *Server) GetStateByResource(ctx context.Context, req *proto.GetStateByResourceRequest) (*proto.GetStateResponse, error) {
	st, err := s.stateRepo.GetByResourceID(ctx, req.ResourceID)
	if err != nil {
		return nil, toGRPCError(err)
	}
	return &proto.GetStateResponse{State: toProtoState(st)}, nil
}

func (s *Server) ComputeDiff(ctx context.Context, req *proto.ComputeDiffRequest) (*proto.ComputeDiffResponse, error) {
	st, err := s.stateRepo.GetByResourceID(ctx, req.ResourceID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	diffs := st.ComputeDiff()
	result := make([]*proto.StateDiff, len(diffs))
	for i, d := range diffs {
		result[i] = &proto.StateDiff{
			ResourceAddress: d.ResourceAddress,
			Type:            proto.DiffType(d.Type),
			Desired:         d.Desired,
			Current:         d.Current,
		}
	}

	return &proto.ComputeDiffResponse{
		Diffs:    result,
		HasDrift: len(diffs) > 0,
	}, nil
}

func (s *Server) ReconcileState(ctx context.Context, req *proto.ReconcileStateRequest) (*proto.ReconcileStateResponse, error) {
	st, err := s.stateRepo.GetByResourceID(ctx, req.ResourceID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	st.Reconcile()
	if err := s.stateRepo.Update(ctx, st); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.ReconcileStateResponse{
		State:   toProtoState(st),
		Applied: true,
	}, nil
}

func (s *Server) ListVersions(ctx context.Context, req *proto.ListVersionsRequest) (*proto.ListVersionsResponse, error) {
	versions, err := s.stateRepo.ListVersions(ctx, req.ResourceID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	result := make([]*proto.StateVersion, len(versions))
	for i, v := range versions {
		result[i] = &proto.StateVersion{
			Version:   int32(v.Version),
			State:     v.State,
			Trigger:   v.Trigger,
			CreatedAt: v.CreatedAt,
		}
	}

	return &proto.ListVersionsResponse{
		Versions: result,
		Pagination: &proto.PaginationResponse{TotalCount: int32(len(result))},
	}, nil
}

func (s *Server) RestoreVersion(ctx context.Context, req *proto.RestoreVersionRequest) (*proto.RestoreVersionResponse, error) {
	st, err := s.stateRepo.GetByResourceID(ctx, req.ResourceID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	st.Reconcile()
	if err := s.stateRepo.Update(ctx, st); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.RestoreVersionResponse{
		State:    toProtoState(st),
		Restored: true,
	}, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// Provider Service
// ═══════════════════════════════════════════════════════════════════════════

func (s *Server) RegisterProvider(ctx context.Context, req *proto.RegisterProviderRequest) (*proto.RegisterProviderResponse, error) {
	if req.TenantID == "" || req.Type == "" || req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "tenant_id, type, and name are required")
	}

	tenantID := req.TenantID
	if tenantID == "" {
		tenantID = "default"
	}

	prov := provider.NewProvider(tenantID, provider.ProviderType(req.Type), req.Name, req.Config)
	if err := s.providerRepo.Create(ctx, prov); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.RegisterProviderResponse{Provider: toProtoProvider(prov)}, nil
}

func (s *Server) GetProvider(ctx context.Context, req *proto.GetProviderRequest) (*proto.GetProviderResponse, error) {
	prov, err := s.providerRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}
	return &proto.GetProviderResponse{Provider: toProtoProvider(prov)}, nil
}

func (s *Server) ListProviders(ctx context.Context, req *proto.ListProvidersRequest) (*proto.ListProvidersResponse, error) {
	tenantID := req.TenantID
	if tenantID == "" {
		tenantID = "default"
	}

	providers, err := s.providerRepo.ListByTenant(ctx, tenantID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	result := make([]*proto.Provider, len(providers))
	for i, p := range providers {
		result[i] = toProtoProvider(p)
	}

	return &proto.ListProvidersResponse{
		Providers: result,
		Pagination: &proto.PaginationResponse{TotalCount: int32(len(result))},
	}, nil
}

func (s *Server) UpdateProvider(ctx context.Context, req *proto.UpdateProviderRequest) (*proto.UpdateProviderResponse, error) {
	prov, err := s.providerRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	if req.Name != "" {
		prov.Name = req.Name
	}
	if req.Config != nil {
		prov.Config = req.Config
	}

	if err := s.providerRepo.Update(ctx, prov); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.UpdateProviderResponse{Provider: toProtoProvider(prov)}, nil
}

func (s *Server) DeleteProvider(ctx context.Context, req *proto.DeleteProviderRequest) error {
	if err := s.providerRepo.Delete(ctx, req.ID); err != nil {
		return toGRPCError(err)
	}
	return nil
}

func (s *Server) ProviderHealthCheck(ctx context.Context, req *proto.ProviderHealthCheckRequest) (*proto.ProviderHealthCheckResponse, error) {
	prov, err := s.providerRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	healthy := prov.Status == provider.ProviderStatusHealthy
	return &proto.ProviderHealthCheckResponse{
		Healthy: healthy,
		Message: fmt.Sprintf("provider %s status: %s", prov.Name, prov.Status),
	}, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// Audit Service
// ═══════════════════════════════════════════════════════════════════════════

func (s *Server) ListAuditEvents(ctx context.Context, req *proto.ListAuditEventsRequest) (*proto.ListAuditEventsResponse, error) {
	tenantID := req.TenantID
	if tenantID == "" {
		tenantID = "default"
	}

	events, total, err := s.auditRepo.ListByTenant(ctx, tenantID, audit.AuditFilter{
		Action:       req.Action,
		ResourceType: req.ResourceType,
		Limit:        50,
	})
	if err != nil {
		return nil, toGRPCError(err)
	}

	result := make([]*proto.AuditEvent, len(events))
	for i, e := range events {
		result[i] = &proto.AuditEvent{
			ID:           e.ID,
			TenantID:     e.TenantID,
			UserID:       e.UserID,
			Action:       e.Action,
			ResourceType: e.ResourceType,
			ResourceID:   e.ResourceID,
			Details:      e.Details,
			IPAddress:    e.IPAddress,
			UserAgent:    e.UserAgent,
			Timestamp:    e.CreatedAt,
		}
	}

	return &proto.ListAuditEventsResponse{
		Events: result,
		Pagination: &proto.PaginationResponse{TotalCount: int32(total)},
	}, nil
}

func (s *Server) GetAuditEvent(ctx context.Context, req *proto.GetAuditEventRequest) (*proto.GetAuditEventResponse, error) {
	event, err := s.auditRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.GetAuditEventResponse{
		Event: &proto.AuditEvent{
			ID:           event.ID,
			TenantID:     event.TenantID,
			UserID:       event.UserID,
			Action:       event.Action,
			ResourceType: event.ResourceType,
			ResourceID:   event.ResourceID,
			Details:      event.Details,
			IPAddress:    event.IPAddress,
			UserAgent:    event.UserAgent,
			Timestamp:    event.CreatedAt,
		},
	}, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// Drift Service
// ═══════════════════════════════════════════════════════════════════════════

func (s *Server) DetectDrift(ctx context.Context, req *proto.DetectDriftRequest) (*proto.DetectDriftResponse, error) {
	tenantID := req.TenantID
	if tenantID == "" {
		tenantID = "default"
	}

	resources, err := s.resourceRepo.ListByState(ctx, resource.RStateDrifted)
	if err != nil {
		return nil, toGRPCError(err)
	}

	reports := make([]*proto.DriftReport, 0)
	for _, r := range resources {
		reports = append(reports, &proto.DriftReport{
			ResourceID:   r.ID,
			ResourceName: r.Name,
			HasDrift:     true,
		})
	}

	return &proto.DetectDriftResponse{
		Reports:      reports,
		TotalScanned: int32(len(resources)),
		DriftedCount: int32(len(reports)),
	}, nil
}

func (s *Server) ReconcileDrift(ctx context.Context, req *proto.ReconcileDriftRequest) (*proto.ReconcileEvent, error) {
	st, err := s.stateRepo.GetByResourceID(ctx, req.ResourceID)
	if err != nil {
		return nil, toGRPCError(err)
	}

	st.Reconcile()
	if err := s.stateRepo.Update(ctx, st); err != nil {
		return nil, toGRPCError(err)
	}

	return &proto.ReconcileEvent{
		ResourceID: req.ResourceID,
		EventType:  "reconciled",
		Status:     "success",
		Message:    "Drift reconciled",
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
	}, nil
}

func (s *Server) ListDriftedResources(ctx context.Context, req *proto.ListDriftedResourcesRequest) (*proto.ListDriftedResourcesResponse, error) {
	resources, err := s.resourceRepo.ListByState(ctx, resource.RStateDrifted)
	if err != nil {
		return nil, toGRPCError(err)
	}

	reports := make([]*proto.DriftReport, 0)
	for _, r := range resources {
		reports = append(reports, &proto.DriftReport{
			ResourceID:   r.ID,
			ResourceName: r.Name,
			HasDrift:     true,
		})
	}

	return &proto.ListDriftedResourcesResponse{
		Reports: reports,
		Pagination: &proto.PaginationResponse{TotalCount: int32(len(reports))},
	}, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// Converters
// ═══════════════════════════════════════════════════════════════════════════

func toProtoDeployment(d *deployment.Deployment) *proto.Deployment {
	return &proto.Deployment{
		ID:          d.ID,
		TenantID:    d.TenantID,
		Name:        d.Name,
		Description: d.Description,
		Status:      proto.DeploymentStatus(d.Status),
		Config: &proto.DeploymentConfig{
			ExecutorType: d.Config.ExecutorType,
			ProviderType: d.Config.ProviderType,
			AutoApprove:  d.Config.AutoApprove,
			Variables:    d.Config.Variables,
			WorkspaceDir: d.Config.WorkDir,
			Timeout:      int64(d.Config.Timeout),
			Tags:         d.Config.Tags,
		},
		WorkflowID: d.WorkflowID,
		Error:      d.Error,
		Metadata:   d.Metadata,
		Version:    int32(d.Version),
		CreatedAt:  d.CreatedAt,
		UpdatedAt:  d.UpdatedAt,
	}
}

func toProtoWorkflow(wf *workflow.Workflow) *proto.Workflow {
	steps := make([]*proto.WorkflowStep, len(wf.Steps))
	for i, s := range wf.Steps {
		steps[i] = &proto.WorkflowStep{
			ID:         s.ID,
			Name:       s.Name,
			Type:       string(s.Type),
			ResourceID: s.ResourceID,
			Config:     s.Config,
			DependsOn:  s.DependsOn,
			Status:     proto.WorkflowStepStatus(s.Status),
			RetryMax:   int32(s.RetryMax),
			Timeout:    s.Timeout,
		}
	}
	return &proto.Workflow{
		ID:           wf.ID,
		DeploymentID: wf.DeploymentID,
		Status:       proto.WorkflowStatus(wf.Status),
		Steps:        steps,
		CurrentBatch: int32(wf.CurrentBatch),
		Error:        wf.Error,
		CreatedAt:    wf.CreatedAt,
		UpdatedAt:    wf.UpdatedAt,
	}
}

func toProtoExecution(e *execution.Execution) *proto.Execution {
	return &proto.Execution{
		ID:           e.ID,
		WorkflowID:   e.WorkflowID,
		StepId:       e.StepID,
		ExecutorType: e.ExecutorType,
		ProviderType: e.ProviderType,
		Status:       proto.ExecutionStatus(e.Status),
		WorkDir:      e.WorkDir,
		RetryCount:   int32(e.RetryCount),
		MaxRetries:   int32(e.MaxRetries),
		StartedAt:    e.StartedAt,
		CompletedAt:  e.CompletedAt,
		Error:        e.Error,
	}
}

func toProtoResource(r *resource.ManagedResource) *proto.ManagedResource {
	return &proto.ManagedResource{
		ID:           r.ID,
		DeploymentID: r.DeploymentID,
		TenantID:     r.TenantID,
		Provider:     r.Provider,
		Type:         r.Type,
		Name:         r.Name,
		Address:      r.Address,
		State:        proto.ResourceState(r.State),
		Config:       r.Config,
		Dependencies: r.Dependencies,
		Metadata:     r.Metadata,
		IsLocked:     r.IsLocked(),
		CreatedAt:    r.CreatedAt,
		UpdatedAt:    r.UpdatedAt,
	}
}

func toProtoState(s *state.StateEntry) *proto.StateEntry {
	return &proto.StateEntry{
		ID:           s.ID,
		ResourceID:   s.ResourceID,
		DeploymentID: s.DeploymentID,
		TenantID:     s.TenantID,
		DesiredState: s.DesiredState,
		CurrentState: s.CurrentState,
		Status:       proto.StateStatus(s.Status),
		Version:      int32(s.Version),
		CreatedAt:    s.CreatedAt,
		UpdatedAt:    s.UpdatedAt,
	}
}

func toProtoProvider(p *provider.Provider) *proto.Provider {
	caps := make([]string, len(p.Capabilities))
	for i, c := range p.Capabilities {
		caps[i] = string(c)
	}
	return &proto.Provider{
		ID:           p.ID,
		TenantID:     p.TenantID,
		Type:         string(p.Type),
		Name:         p.Name,
		Status:       proto.ProviderStatus(p.Status),
		Config:       p.Config,
		Capabilities: caps,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}

func toGRPCError(err error) error {
	if domainErr, ok := err.(*shared.DomainError); ok {
		switch domainErr.Code {
		case "NOT_FOUND":
			return status.Error(codes.NotFound, domainErr.Message)
		case "ALREADY_EXISTS":
			return status.Error(codes.AlreadyExists, domainErr.Message)
		case "INVALID_STATE":
			return status.Error(codes.FailedPrecondition, domainErr.Message)
		case "VALIDATION":
			return status.Error(codes.InvalidArgument, domainErr.Message)
		case "UNAUTHORIZED":
			return status.Error(codes.PermissionDenied, domainErr.Message)
		case "CONFLICT":
			return status.Error(codes.Aborted, domainErr.Message)
		case "TIMEOUT":
			return status.Error(codes.DeadlineExceeded, domainErr.Message)
		}
	}
	return status.Error(codes.Internal, err.Error())
}
