package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/execution"
)

// ExecutionRepository implements execution.Repository for PostgreSQL.
type ExecutionRepository struct {
	db *DB
}

// NewExecutionRepository creates a new PostgreSQL execution repository.
func NewExecutionRepository(db *DB) *ExecutionRepository {
	return &ExecutionRepository{db: db}
}

// Create inserts a new execution.
func (r *ExecutionRepository) Create(ctx context.Context, exec *execution.Execution) error {
	query := `INSERT INTO executions (id, workflow_id, step_id, executor_type, provider_type, status, work_dir, retry_count, max_retries, started_at, error, version, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`
	_, err := r.db.ExecContext(ctx, query,
		exec.ID, exec.WorkflowID, exec.StepID, exec.ExecutorType, exec.ProviderType,
		exec.Status, exec.WorkDir, exec.RetryCount, exec.MaxRetries,
		exec.StartedAt, exec.Error, exec.Version, exec.CreatedAt, exec.UpdatedAt)
	return err
}

// GetByID retrieves an execution by ID.
func (r *ExecutionRepository) GetByID(ctx context.Context, id string) (*execution.Execution, error) {
	query := `SELECT id, workflow_id, step_id, executor_type, provider_type, status, work_dir, retry_count, max_retries, started_at, completed_at, error, version, created_at, updated_at
		FROM executions WHERE id = $1`
	exec := &execution.Execution{}
	var startedAt, completedAt sql.NullTime
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&exec.ID, &exec.WorkflowID, &exec.StepID, &exec.ExecutorType, &exec.ProviderType,
		&exec.Status, &exec.WorkDir, &exec.RetryCount, &exec.MaxRetries,
		&startedAt, &completedAt, &exec.Error, &exec.Version, &exec.CreatedAt, &exec.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if startedAt.Valid {
		exec.StartedAt = &startedAt.Time
	}
	if completedAt.Valid {
		exec.CompletedAt = &completedAt.Time
	}
	return exec, nil
}

// Update updates an execution.
func (r *ExecutionRepository) Update(ctx context.Context, exec *execution.Execution) error {
	query := `UPDATE executions SET status = $2, retry_count = $3, error = $4, completed_at = $5, version = $6, updated_at = $7 WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query,
		exec.ID, exec.Status, exec.RetryCount, exec.Error,
		exec.CompletedAt, exec.Version, exec.UpdatedAt)
	return err
}

// ListByWorkflowID lists executions for a workflow.
func (r *ExecutionRepository) ListByWorkflowID(ctx context.Context, workflowID string) ([]*execution.Execution, error) {
	query := `SELECT id, workflow_id, step_id, executor_type, provider_type, status, work_dir, retry_count, max_retries, started_at, completed_at, error, version, created_at, updated_at
		FROM executions WHERE workflow_id = $1 ORDER BY created_at`
	rows, err := r.db.QueryContext(ctx, query, workflowID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*execution.Execution
	for rows.Next() {
		exec := &execution.Execution{}
		var startedAt, completedAt sql.NullTime
		if err := rows.Scan(&exec.ID, &exec.WorkflowID, &exec.StepID, &exec.ExecutorType, &exec.ProviderType,
			&exec.Status, &exec.WorkDir, &exec.RetryCount, &exec.MaxRetries,
			&startedAt, &completedAt, &exec.Error, &exec.Version, &exec.CreatedAt, &exec.UpdatedAt); err != nil {
			return nil, err
		}
		if startedAt.Valid {
			exec.StartedAt = &startedAt.Time
		}
		if completedAt.Valid {
			exec.CompletedAt = &completedAt.Time
		}
		result = append(result, exec)
	}
	return result, nil
}

// ListByStatus lists executions by status.
func (r *ExecutionRepository) ListByStatus(ctx context.Context, status execution.ExecutionStatus) ([]*execution.Execution, error) {
	query := `SELECT id, workflow_id, step_id, executor_type, provider_type, status, work_dir, retry_count, max_retries, started_at, completed_at, error, version, created_at, updated_at
		FROM executions WHERE status = $1 ORDER BY created_at`
	rows, err := r.db.QueryContext(ctx, query, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*execution.Execution
	for rows.Next() {
		exec := &execution.Execution{}
		var startedAt, completedAt sql.NullTime
		if err := rows.Scan(&exec.ID, &exec.WorkflowID, &exec.StepID, &exec.ExecutorType, &exec.ProviderType,
			&exec.Status, &exec.WorkDir, &exec.RetryCount, &exec.MaxRetries,
			&startedAt, &completedAt, &exec.Error, &exec.Version, &exec.CreatedAt, &exec.UpdatedAt); err != nil {
			return nil, err
		}
		if startedAt.Valid {
			exec.StartedAt = &startedAt.Time
		}
		if completedAt.Valid {
			exec.CompletedAt = &completedAt.Time
		}
		result = append(result, exec)
	}
	return result, nil
}

var _ = time.Now
