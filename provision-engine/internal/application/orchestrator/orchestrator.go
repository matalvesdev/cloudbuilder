package orchestrator

import (
	"context"
	"fmt"
	"sync"

	"github.com/cloudbuilder/provision-engine/internal/application/planner"
	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
	"github.com/cloudbuilder/provision-engine/internal/domain/execution"
	"github.com/cloudbuilder/provision-engine/internal/domain/plugin"
	"github.com/cloudbuilder/provision-engine/internal/domain/workflow"
)

// Orchestrator coordinates workflow execution across multiple steps.
type Orchestrator struct {
	deploymentRepo deployment.Repository
	workflowRepo   workflow.Repository
	executionRepo  execution.Repository
	registry       *plugin.Registry
	maxParallel    int
}

// NewOrchestrator creates a new workflow orchestrator.
func NewOrchestrator(
	depRepo deployment.Repository,
	wfRepo workflow.Repository,
	execRepo execution.Repository,
	registry *plugin.Registry,
	maxParallel int,
) *Orchestrator {
	if maxParallel <= 0 {
		maxParallel = 10
	}
	return &Orchestrator{
		deploymentRepo: depRepo,
		workflowRepo:   wfRepo,
		executionRepo:  execRepo,
		registry:       registry,
		maxParallel:    maxParallel,
	}
}

// ExecuteWorkflow executes a complete workflow for a deployment.
func (o *Orchestrator) ExecuteWorkflow(ctx context.Context, deploymentID string) error {
	dep, err := o.deploymentRepo.GetByID(ctx, deploymentID)
	if err != nil {
		return fmt.Errorf("get deployment: %w", err)
	}

	wf, err := o.workflowRepo.GetByDeploymentID(ctx, deploymentID)
	if err != nil {
		return fmt.Errorf("get workflow: %w", err)
	}

	if dep.Status != deployment.StatusExecuting {
		if err := dep.StartExecution(); err != nil {
			return fmt.Errorf("start execution: %w", err)
		}
	}
	if err := o.deploymentRepo.Update(ctx, dep); err != nil {
		return err
	}

	if err := wf.Start(); err != nil {
		return fmt.Errorf("start workflow: %w", err)
	}
	if err := o.workflowRepo.Update(ctx, wf); err != nil {
		return err
	}

	batches, err := o.computeBatches(wf)
	if err != nil {
		return fmt.Errorf("compute batches: %w", err)
	}

	for _, batch := range batches {
		if err := o.executeBatch(ctx, wf, batch); err != nil {
			_ = dep.Fail(err)
			_ = o.deploymentRepo.Update(ctx, dep)
			_ = wf.Fail(err)
			_ = o.workflowRepo.Update(ctx, wf)
			return err
		}
	}

	if err := wf.Complete(); err != nil {
		return err
	}
	if err := o.workflowRepo.Update(ctx, wf); err != nil {
		return err
	}

	if err := dep.Complete(); err != nil {
		return err
	}
	return o.deploymentRepo.Update(ctx, dep)
}

// executeBatch executes a batch of steps in parallel.
func (o *Orchestrator) executeBatch(ctx context.Context, wf *workflow.Workflow, batch []*planner.Node) error {
	sem := make(chan struct{}, o.maxParallel)
	var wg sync.WaitGroup
	var firstErr error
	var mu sync.Mutex

	for _, node := range batch {
		step := findStep(wf, node.ID)
		if step == nil {
			continue
		}

		wg.Add(1)
		sem <- struct{}{}

		go func(n *planner.Node, s *workflow.WorkflowStep) {
			defer wg.Done()
			defer func() { <-sem }()

			if err := o.executeStep(ctx, wf, s); err != nil {
				mu.Lock()
				if firstErr == nil {
					firstErr = err
				}
				mu.Unlock()
			}
		}(node, step)
	}

	wg.Wait()
	return firstErr
}

// executeStep executes a single workflow step.
func (o *Orchestrator) executeStep(ctx context.Context, wf *workflow.Workflow, step *workflow.WorkflowStep) error {
	step.Status = workflow.SStatusRunning

	execType := plugin.ExecutorType(step.Type)
	exec, ok := o.registry.GetExecutor(execType)
	if !ok {
		return fmt.Errorf("executor not found: %s", step.Type)
	}

	result, err := exec.Apply(ctx, step.Config["workDir"], step.ID)
	if err != nil {
		step.Status = workflow.SStatusFailed
		return err
	}
	if !result.Success {
		step.Status = workflow.SStatusFailed
		step.Result = &workflow.StepResult{
			Success: false,
			Error:   result.Error,
		}
		return fmt.Errorf("executor failed: %s", result.Error)
	}

	step.Status = workflow.SStatusCompleted
	step.Result = &workflow.StepResult{
		Success:  result.Success,
		Duration: 0,
	}
	return nil
}

func (o *Orchestrator) computeBatches(wf *workflow.Workflow) ([][]*planner.Node, error) {
	dag := planner.NewDAG()
	for _, step := range wf.Steps {
		dag.AddNode(&planner.Node{
			ID:        step.ID,
			DependsOn: step.DependsOn,
		})
	}
	for _, step := range wf.Steps {
		for _, dep := range step.DependsOn {
			_ = dag.AddEdge(step.ID, dep)
		}
	}
	return dag.ParallelBatches()
}

func findStep(wf *workflow.Workflow, stepID string) *workflow.WorkflowStep {
	for i := range wf.Steps {
		if wf.Steps[i].ID == stepID {
			return &wf.Steps[i]
		}
	}
	return nil
}
