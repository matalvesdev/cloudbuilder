package command

import (
	"context"

	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
)

// CreateDeploymentCommand is the command to create a new deployment.
type CreateDeploymentCommand struct {
	TenantID    string                   `json:"tenantId"`
	Name        string                   `json:"name"`
	Description string                   `json:"description,omitempty"`
	Config      deployment.DeploymentConfig `json:"config"`
}

// CreateDeploymentHandler handles CreateDeploymentCommand.
type CreateDeploymentHandler struct {
	service *deployment.Service
}

// NewCreateDeploymentHandler creates a new handler.
func NewCreateDeploymentHandler(service *deployment.Service) *CreateDeploymentHandler {
	return &CreateDeploymentHandler{service: service}
}

// Handle executes the command.
func (h *CreateDeploymentHandler) Handle(ctx context.Context, cmd CreateDeploymentCommand) (*deployment.Deployment, error) {
	return h.service.Create(ctx, cmd.TenantID, cmd.Name, cmd.Description, cmd.Config)
}

// ApproveDeploymentCommand is the command to approve a deployment.
type ApproveDeploymentCommand struct {
	DeploymentID string `json:"deploymentId"`
	Approver     string `json:"approver"`
}

// ApproveDeploymentHandler handles ApproveDeploymentCommand.
type ApproveDeploymentHandler struct {
	repo deployment.Repository
}

// NewApproveDeploymentHandler creates a new handler.
func NewApproveDeploymentHandler(repo deployment.Repository) *ApproveDeploymentHandler {
	return &ApproveDeploymentHandler{repo: repo}
}

// Handle executes the command.
func (h *ApproveDeploymentHandler) Handle(ctx context.Context, cmd ApproveDeploymentCommand) error {
	dep, err := h.repo.GetByID(ctx, cmd.DeploymentID)
	if err != nil {
		return err
	}
	if err := dep.Approve(cmd.Approver); err != nil {
		return err
	}
	return h.repo.Update(ctx, dep)
}

// CancelDeploymentCommand is the command to cancel a deployment.
type CancelDeploymentCommand struct {
	DeploymentID string `json:"deploymentId"`
	Reason       string `json:"reason"`
}

// CancelDeploymentHandler handles CancelDeploymentCommand.
type CancelDeploymentHandler struct {
	service *deployment.Service
}

// NewCancelDeploymentHandler creates a new handler.
func NewCancelDeploymentHandler(service *deployment.Service) *CancelDeploymentHandler {
	return &CancelDeploymentHandler{service: service}
}

// Handle executes the command.
func (h *CancelDeploymentHandler) Handle(ctx context.Context, cmd CancelDeploymentCommand) error {
	return h.service.Cancel(ctx, cmd.DeploymentID, cmd.Reason)
}
