package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/workflow"
)

// WorkflowRepository implements workflow.Repository for PostgreSQL.
type WorkflowRepository struct {
	db *DB
}

// NewWorkflowRepository creates a new PostgreSQL workflow repository.
func NewWorkflowRepository(db *DB) *WorkflowRepository {
	return &WorkflowRepository{db: db}
}

// Create inserts a new workflow.
func (r *WorkflowRepository) Create(ctx context.Context, wf *workflow.Workflow) error {
	transaction, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer transaction.Rollback()
	query := `INSERT INTO workflows (id, deployment_id, status, current_batch, error, version, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err = transaction.ExecContext(ctx, query,
		wf.ID, wf.DeploymentID, wf.Status, wf.CurrentBatch,
		wf.Error, wf.Version, wf.CreatedAt, wf.UpdatedAt)
	if err != nil {
		return err
	}
	if err := persistWorkflowSteps(ctx, transaction, wf); err != nil {
		return err
	}
	return transaction.Commit()
}

// GetByID retrieves a workflow by ID.
func (r *WorkflowRepository) GetByID(ctx context.Context, id string) (*workflow.Workflow, error) {
	query := `SELECT id, deployment_id, status, current_batch, error, version, created_at, updated_at
		FROM workflows WHERE id = $1`
	wf := &workflow.Workflow{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&wf.ID, &wf.DeploymentID, &wf.Status, &wf.CurrentBatch,
		&wf.Error, &wf.Version, &wf.CreatedAt, &wf.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Load steps
	steps, err := r.loadSteps(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("load steps: %w", err)
	}
	wf.Steps = steps

	return wf, nil
}

// Update updates a workflow.
func (r *WorkflowRepository) Update(ctx context.Context, wf *workflow.Workflow) error {
	transaction, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer transaction.Rollback()
	query := `UPDATE workflows SET status = $2, current_batch = $3, error = $4, version = $5, updated_at = $6 WHERE id = $1`
	_, err = transaction.ExecContext(ctx, query,
		wf.ID, wf.Status, wf.CurrentBatch, wf.Error, wf.Version, wf.UpdatedAt)
	if err != nil {
		return err
	}
	if err := persistWorkflowSteps(ctx, transaction, wf); err != nil {
		return err
	}
	return transaction.Commit()
}

// GetByDeploymentID retrieves the workflow for a deployment.
func (r *WorkflowRepository) GetByDeploymentID(ctx context.Context, deploymentID string) (*workflow.Workflow, error) {
	query := `SELECT id, deployment_id, status, current_batch, error, version, created_at, updated_at
		FROM workflows WHERE deployment_id = $1 ORDER BY created_at DESC LIMIT 1`
	wf := &workflow.Workflow{}
	err := r.db.QueryRowContext(ctx, query, deploymentID).Scan(
		&wf.ID, &wf.DeploymentID, &wf.Status, &wf.CurrentBatch,
		&wf.Error, &wf.Version, &wf.CreatedAt, &wf.UpdatedAt)
	if err != nil {
		return nil, err
	}

	steps, err := r.loadSteps(ctx, wf.ID)
	if err != nil {
		return nil, fmt.Errorf("load steps: %w", err)
	}
	wf.Steps = steps

	return wf, nil
}

// ListByStatus retrieves workflows by status.
func (r *WorkflowRepository) ListByStatus(ctx context.Context, status workflow.WorkflowStatus) ([]*workflow.Workflow, error) {
	query := `SELECT id, deployment_id, status, current_batch, error, version, created_at, updated_at
		FROM workflows WHERE status = $1 ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, query, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*workflow.Workflow
	for rows.Next() {
		wf := &workflow.Workflow{}
		if err := rows.Scan(&wf.ID, &wf.DeploymentID, &wf.Status, &wf.CurrentBatch,
			&wf.Error, &wf.Version, &wf.CreatedAt, &wf.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, wf)
	}
	return result, nil
}

func (r *WorkflowRepository) loadSteps(ctx context.Context, workflowID string) ([]workflow.WorkflowStep, error) {
	query := `SELECT id, name, type, resource_id, config, depends_on, status, result, retry_max, timeout_seconds
		FROM workflow_steps WHERE workflow_id = $1 ORDER BY created_at`
	rows, err := r.db.QueryContext(ctx, query, workflowID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var steps []workflow.WorkflowStep
	for rows.Next() {
		s := workflow.WorkflowStep{}
		var dependsOn string
		var configJSON []byte
		var resultJSON []byte
		if err := rows.Scan(
			&s.ID, &s.Name, &s.Type, &s.ResourceID, &configJSON, &dependsOn,
			&s.Status, &resultJSON, &s.RetryMax, &s.Timeout,
		); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(configJSON, &s.Config); err != nil {
			return nil, fmt.Errorf("decode workflow step config: %w", err)
		}
		if len(resultJSON) > 0 {
			var result workflow.StepResult
			if err := json.Unmarshal(resultJSON, &result); err != nil {
				return nil, fmt.Errorf("decode workflow step result: %w", err)
			}
			s.Result = &result
		}
		if dependsOn != "" {
			s.DependsOn = splitComma(dependsOn)
		}
		steps = append(steps, s)
	}
	return steps, nil
}

type workflowExecutor interface {
	ExecContext(context.Context, string, ...interface{}) (sql.Result, error)
}

func persistWorkflowSteps(
	ctx context.Context,
	executor workflowExecutor,
	wf *workflow.Workflow,
) error {
	if _, err := executor.ExecContext(
		ctx,
		`DELETE FROM workflow_steps WHERE workflow_id = $1`,
		wf.ID,
	); err != nil {
		return err
	}
	for _, step := range wf.Steps {
		configJSON, err := json.Marshal(step.Config)
		if err != nil {
			return err
		}
		var resultJSON interface{}
		if step.Result != nil {
			encoded, err := json.Marshal(step.Result)
			if err != nil {
				return err
			}
			resultJSON = string(encoded)
		}
		_, err = executor.ExecContext(
			ctx,
			`INSERT INTO workflow_steps (
				id, workflow_id, name, type, resource_id, config, depends_on,
				status, result, retry_max, timeout_seconds
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			step.ID,
			wf.ID,
			step.Name,
			step.Type,
			step.ResourceID,
			string(configJSON),
			joinComma(step.DependsOn),
			step.Status,
			resultJSON,
			step.RetryMax,
			step.Timeout,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func splitComma(s string) []string {
	if s == "" {
		return nil
	}
	result := make([]string, 0)
	for _, part := range []byte(s) {
		_ = part
	}
	// Simple comma split
	start := 0
	for i := 0; i <= len(s); i++ {
		if i == len(s) || s[i] == ',' {
			if i > start {
				result = append(result, s[start:i])
			}
			start = i + 1
		}
	}
	return result
}

// Ensure unused import doesn't cause issues
var _ = time.Now
var _ = sql.ErrNoRows
