package executor

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
)

type DeploymentManager struct {
	executor *Executor
}

func NewDeploymentManager(executor *Executor) *DeploymentManager {
	return &DeploymentManager{executor: executor}
}

type DeploymentStatus int

const (
	StatusPending    DeploymentStatus = iota
	StatusInit       DeploymentStatus = iota
	StatusPlanning   DeploymentStatus = iota
	StatusPlanned    DeploymentStatus = iota
	StatusApplying   DeploymentStatus = iota
	StatusApplied    DeploymentStatus = iota
	StatusFailed     DeploymentStatus = iota
	StatusDestroying DeploymentStatus = iota
	StatusDestroyed  DeploymentStatus = iota
)

var statusNames = []string{"PENDING", "INIT", "PLANNING", "PLANNED", "APPLYING", "APPLIED", "FAILED", "DESTROYING", "DESTROYED"}

func (s DeploymentStatus) String() string {
	if int(s) < len(statusNames) {
		return statusNames[s]
	}
	return "UNKNOWN"
}

func (dm *DeploymentManager) WriteCode(files map[string]string) error {
	for filename, content := range files {
		filePath := filepath.Join(dm.executor.GetWorkDir(), filename)
		dir := filepath.Dir(filePath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
		if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
			return fmt.Errorf("failed to write file %s: %w", filename, err)
		}
	}
	return nil
}

func (dm *DeploymentManager) Execute(ctx context.Context, statusChan chan<- DeploymentStatus) error {
	statusChan <- StatusInit
	if _, err := dm.executor.Init(ctx); err != nil {
		statusChan <- StatusFailed
		return fmt.Errorf("init failed: %w", err)
	}

	statusChan <- StatusPlanning
	planFile := filepath.Join(dm.executor.GetWorkDir(), "tfplan")
	if _, err := dm.executor.Plan(ctx, planFile); err != nil {
		statusChan <- StatusFailed
		return fmt.Errorf("plan failed: %w", err)
	}
	statusChan <- StatusPlanned

	return nil
}

func (dm *DeploymentManager) Apply(ctx context.Context, statusChan chan<- DeploymentStatus) error {
	statusChan <- StatusApplying
	planFile := filepath.Join(dm.executor.GetWorkDir(), "tfplan")
	if _, err := dm.executor.Apply(ctx, planFile); err != nil {
		statusChan <- StatusFailed
		return fmt.Errorf("apply failed: %w", err)
	}
	statusChan <- StatusApplied
	return nil
}

func (dm *DeploymentManager) Destroy(ctx context.Context, statusChan chan<- DeploymentStatus) error {
	statusChan <- StatusDestroying
	if _, err := dm.executor.Destroy(ctx); err != nil {
		statusChan <- StatusFailed
		return fmt.Errorf("destroy failed: %w", err)
	}
	statusChan <- StatusDestroyed
	return nil
}
