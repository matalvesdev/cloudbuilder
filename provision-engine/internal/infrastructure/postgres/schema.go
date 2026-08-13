package postgres

import (
	"context"
	"database/sql"
	"fmt"
)

// migrate owns the provision-engine tables. DDL is idempotent so a new
// instance can initialize an empty PostgreSQL database without relying on a
// manually prepared schema.
func migrate(ctx context.Context, db *sql.DB) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS pe_schema_migrations (
			version INTEGER PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS deployments (
			id VARCHAR(64) PRIMARY KEY,
			tenant_id VARCHAR(64) NOT NULL,
			name VARCHAR(255) NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			status VARCHAR(40) NOT NULL,
			config JSONB NOT NULL DEFAULT '{}'::jsonb,
			workflow_id VARCHAR(64) NOT NULL DEFAULT '',
			error TEXT NOT NULL DEFAULT '',
			metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
			version BIGINT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS idx_pe_deployments_tenant_created
			ON deployments(tenant_id, created_at DESC)`,
		`CREATE TABLE IF NOT EXISTS workflows (
			id VARCHAR(64) PRIMARY KEY,
			deployment_id VARCHAR(64) NOT NULL,
			status VARCHAR(40) NOT NULL,
			current_batch INTEGER NOT NULL DEFAULT 0,
			error TEXT NOT NULL DEFAULT '',
			version BIGINT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS idx_pe_workflows_deployment
			ON workflows(deployment_id, created_at DESC)`,
		`CREATE TABLE IF NOT EXISTS workflow_steps (
			id VARCHAR(64) PRIMARY KEY,
			workflow_id VARCHAR(64) NOT NULL,
			name VARCHAR(255) NOT NULL,
			type VARCHAR(80) NOT NULL,
			resource_id VARCHAR(64) NOT NULL DEFAULT '',
			config JSONB NOT NULL DEFAULT '{}'::jsonb,
			depends_on TEXT NOT NULL DEFAULT '',
			status VARCHAR(40) NOT NULL,
			result JSONB,
			retry_max INTEGER NOT NULL DEFAULT 0,
			timeout_seconds BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_pe_workflow_steps_workflow
			ON workflow_steps(workflow_id, created_at)`,
		`CREATE TABLE IF NOT EXISTS executions (
			id VARCHAR(64) PRIMARY KEY,
			workflow_id VARCHAR(64) NOT NULL,
			step_id VARCHAR(64) NOT NULL,
			executor_type VARCHAR(80) NOT NULL,
			provider_type VARCHAR(80) NOT NULL,
			status VARCHAR(40) NOT NULL,
			work_dir TEXT NOT NULL DEFAULT '',
			retry_count INTEGER NOT NULL DEFAULT 0,
			max_retries INTEGER NOT NULL DEFAULT 0,
			started_at TIMESTAMPTZ,
			completed_at TIMESTAMPTZ,
			error TEXT NOT NULL DEFAULT '',
			version BIGINT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS idx_pe_executions_workflow
			ON executions(workflow_id, created_at)`,
		`CREATE TABLE IF NOT EXISTS managed_resources (
			id VARCHAR(64) PRIMARY KEY,
			deployment_id VARCHAR(64) NOT NULL,
			tenant_id VARCHAR(64) NOT NULL,
			provider VARCHAR(80) NOT NULL,
			type VARCHAR(160) NOT NULL,
			name VARCHAR(255) NOT NULL,
			address TEXT NOT NULL,
			state VARCHAR(40) NOT NULL,
			config JSONB NOT NULL DEFAULT '{}'::jsonb,
			dependencies TEXT NOT NULL DEFAULT '',
			metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
			is_locked BOOLEAN NOT NULL DEFAULT FALSE,
			version BIGINT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS idx_pe_resources_tenant
			ON managed_resources(tenant_id, created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_pe_resources_deployment
			ON managed_resources(deployment_id, created_at)`,
		`CREATE TABLE IF NOT EXISTS state_entries (
			id VARCHAR(64) PRIMARY KEY,
			resource_id VARCHAR(64) NOT NULL,
			deployment_id VARCHAR(64) NOT NULL,
			tenant_id VARCHAR(64) NOT NULL,
			desired_state JSONB NOT NULL DEFAULT '{}'::jsonb,
			current_state JSONB NOT NULL DEFAULT '{}'::jsonb,
			status VARCHAR(40) NOT NULL,
			version BIGINT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL,
			UNIQUE(resource_id, version)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_pe_state_resource_version
			ON state_entries(resource_id, version DESC)`,
		`CREATE TABLE IF NOT EXISTS providers (
			id VARCHAR(64) PRIMARY KEY,
			tenant_id VARCHAR(64) NOT NULL,
			type VARCHAR(80) NOT NULL,
			name VARCHAR(255) NOT NULL,
			status VARCHAR(40) NOT NULL,
			config JSONB NOT NULL DEFAULT '{}'::jsonb,
			capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
			version BIGINT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL,
			UNIQUE(tenant_id, type)
		)`,
		`CREATE TABLE IF NOT EXISTS audit_events (
			id VARCHAR(64) PRIMARY KEY,
			tenant_id VARCHAR(64) NOT NULL,
			user_id VARCHAR(64) NOT NULL DEFAULT '',
			action VARCHAR(160) NOT NULL,
			resource_type VARCHAR(160) NOT NULL,
			resource_id VARCHAR(64) NOT NULL DEFAULT '',
			details JSONB NOT NULL DEFAULT '{}'::jsonb,
			ip_address VARCHAR(128) NOT NULL DEFAULT '',
			user_agent TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS idx_pe_audit_tenant_created
			ON audit_events(tenant_id, created_at DESC)`,
		`INSERT INTO pe_schema_migrations(version) VALUES (1)
			ON CONFLICT (version) DO NOTHING`,
	}

	transaction, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer transaction.Rollback()

	for index, statement := range statements {
		if _, err := transaction.ExecContext(ctx, statement); err != nil {
			return fmt.Errorf("statement %d: %w", index+1, err)
		}
	}
	return transaction.Commit()
}
