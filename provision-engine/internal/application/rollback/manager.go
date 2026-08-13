package rollback

import (
	"context"
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
	"github.com/cloudbuilder/provision-engine/internal/domain/plugin"
	"github.com/cloudbuilder/provision-engine/internal/domain/state"
)

// Manager handles deployment rollback operations.
type Manager struct {
	deploymentRepo deployment.Repository
	stateRepo      state.Repository
	registry       *plugin.Registry
}

// NewManager creates a new rollback manager.
func NewManager(
	depRepo deployment.Repository,
	stateRepo state.Repository,
	registry *plugin.Registry,
) *Manager {
	return &Manager{
		deploymentRepo: depRepo,
		stateRepo:      stateRepo,
		registry:       registry,
	}
}

// Rollback reverts a deployment to a previous state.
func (m *Manager) Rollback(ctx context.Context, deploymentID string, targetVersion int) error {
	dep, err := m.deploymentRepo.GetByID(ctx, deploymentID)
	if err != nil {
		return fmt.Errorf("get deployment: %w", err)
	}
	if targetVersion <= 0 {
		return fmt.Errorf("target version must be greater than zero")
	}

	execType := plugin.ExecutorType(dep.Config.ExecutorType)
	exec, ok := m.registry.GetExecutor(execType)
	if !ok {
		return fmt.Errorf("executor not found: %s", execType)
	}

	if err := dep.StartRollback(); err != nil {
		return fmt.Errorf("start rollback: %w", err)
	}
	if err := m.deploymentRepo.Update(ctx, dep); err != nil {
		return err
	}

	result, err := exec.Rollback(ctx, dep.Config.WorkDir, fmt.Sprintf("snapshot-%d", targetVersion))
	if err != nil {
		_ = dep.Fail(err)
		_ = m.deploymentRepo.Update(ctx, dep)
		return fmt.Errorf("rollback execution: %w", err)
	}

	if !result.Success {
		_ = dep.Fail(fmt.Errorf("rollback failed: %s", result.Error))
		_ = m.deploymentRepo.Update(ctx, dep)
		return fmt.Errorf("rollback failed: %s", result.Error)
	}

	if err := dep.RollbackComplete(); err != nil {
		return err
	}
	return m.deploymentRepo.Update(ctx, dep)
}
