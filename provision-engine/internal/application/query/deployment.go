package query

import (
	"context"

	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
)

// GetDeploymentQuery retrieves a deployment by ID.
type GetDeploymentQuery struct {
	ID string `json:"id"`
}

// GetDeploymentHandler handles GetDeploymentQuery.
type GetDeploymentHandler struct {
	repo deployment.Repository
}

// NewGetDeploymentHandler creates a new handler.
func NewGetDeploymentHandler(repo deployment.Repository) *GetDeploymentHandler {
	return &GetDeploymentHandler{repo: repo}
}

// Handle executes the query.
func (h *GetDeploymentHandler) Handle(ctx context.Context, q GetDeploymentQuery) (*deployment.Deployment, error) {
	return h.repo.GetByID(ctx, q.ID)
}

// ListDeploymentsQuery lists deployments for a tenant.
type ListDeploymentsQuery struct {
	TenantID string                 `json:"tenantId"`
	Filter   deployment.DeploymentFilter `json:"filter,omitempty"`
}

// ListDeploymentsResult is the result of listing deployments.
type ListDeploymentsResult struct {
	Deployments []*deployment.Deployment `json:"deployments"`
	Total       int                      `json:"total"`
}

// ListDeploymentsHandler handles ListDeploymentsQuery.
type ListDeploymentsHandler struct {
	repo deployment.Repository
}

// NewListDeploymentsHandler creates a new handler.
func NewListDeploymentsHandler(repo deployment.Repository) *ListDeploymentsHandler {
	return &ListDeploymentsHandler{repo: repo}
}

// Handle executes the query.
func (h *ListDeploymentsHandler) Handle(ctx context.Context, q ListDeploymentsQuery) (*ListDeploymentsResult, error) {
	deploys, total, err := h.repo.List(ctx, q.TenantID, q.Filter)
	if err != nil {
		return nil, err
	}
	return &ListDeploymentsResult{Deployments: deploys, Total: total}, nil
}

// ListResourcesQuery lists resources for a deployment.
type ListResourcesQuery struct {
	DeploymentID string `json:"deploymentId"`
}

// ListResourcesHandler handles ListResourcesQuery.
type ListResourcesHandler struct {
	repo resource.Repository
}

// NewListResourcesHandler creates a new handler.
func NewListResourcesHandler(repo resource.Repository) *ListResourcesHandler {
	return &ListResourcesHandler{repo: repo}
}

// Handle executes the query.
func (h *ListResourcesHandler) Handle(ctx context.Context, q ListResourcesQuery) ([]*resource.ManagedResource, error) {
	return h.repo.ListByDeploymentID(ctx, q.DeploymentID)
}
