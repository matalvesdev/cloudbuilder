package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/lib/pq"

	"github.com/cloudbuilder/provision-engine/internal/domain/deployment"
)

// Config holds PostgreSQL configuration.
type Config struct {
	Host         string        `mapstructure:"host"`
	Port         int           `mapstructure:"port"`
	Database     string        `mapstructure:"database"`
	Username     string        `mapstructure:"username"`
	Password     string        `mapstructure:"password"`
	MaxOpenConns int           `mapstructure:"max_open_conns"`
	MaxIdleConns int           `mapstructure:"max_idle_conns"`
	MaxLifetime  time.Duration `mapstructure:"max_lifetime"`
}

// DB wraps database/sql with connection pooling.
type DB struct {
	*sql.DB
}

// New creates a new PostgreSQL connection.
func New(cfg Config) (*DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.Username, cfg.Password, cfg.Database,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.MaxLifetime)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}
	if err := migrate(ctx, db); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("migrate database: %w", err)
	}

	return &DB{db}, nil
}

// DeploymentRepository implements deployment.Repository for PostgreSQL.
type DeploymentRepository struct {
	db *DB
}

// NewDeploymentRepository creates a new PostgreSQL deployment repository.
func NewDeploymentRepository(db *DB) *DeploymentRepository {
	return &DeploymentRepository{db: db}
}

// Create inserts a new deployment.
func (r *DeploymentRepository) Create(ctx context.Context, d *deployment.Deployment) error {
	configJSON, err := json.Marshal(d.Config)
	if err != nil {
		return err
	}
	metadataJSON, err := json.Marshal(d.Metadata)
	if err != nil {
		return err
	}
	query := `INSERT INTO deployments (id, tenant_id, name, description, status, config, workflow_id, error, metadata, version, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
	_, err = r.db.ExecContext(ctx, query,
		d.ID, d.TenantID, d.Name, d.Description, d.Status,
		string(configJSON), d.WorkflowID, d.Error, string(metadataJSON),
		d.Version, d.CreatedAt, d.UpdatedAt)
	return err
}

// GetByID retrieves a deployment by ID.
func (r *DeploymentRepository) GetByID(ctx context.Context, id string) (*deployment.Deployment, error) {
	query := `SELECT id, tenant_id, name, description, status, config, workflow_id, error, metadata, version, created_at, updated_at
		FROM deployments WHERE id = $1`
	return scanDeployment(r.db.QueryRowContext(ctx, query, id))
}

// Update updates a deployment.
func (r *DeploymentRepository) Update(ctx context.Context, d *deployment.Deployment) error {
	configJSON, err := json.Marshal(d.Config)
	if err != nil {
		return err
	}
	metadataJSON, err := json.Marshal(d.Metadata)
	if err != nil {
		return err
	}
	query := `UPDATE deployments SET name = $2, description = $3, status = $4,
		config = $5, workflow_id = $6, error = $7, metadata = $8,
		version = $9, updated_at = $10 WHERE id = $1`
	_, err = r.db.ExecContext(ctx, query,
		d.ID, d.Name, d.Description, d.Status, string(configJSON), d.WorkflowID,
		d.Error, string(metadataJSON), d.Version, d.UpdatedAt)
	return err
}

// Delete deletes a deployment.
func (r *DeploymentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM deployments WHERE id = $1`, id)
	return err
}

// List lists deployments for a tenant.
func (r *DeploymentRepository) List(ctx context.Context, tenantID string, filter deployment.DeploymentFilter) ([]*deployment.Deployment, int, error) {
	query := `SELECT id, tenant_id, name, description, status, config, workflow_id, error, metadata, version, created_at, updated_at
		FROM deployments WHERE tenant_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, query, tenantID)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var result []*deployment.Deployment
	for rows.Next() {
		d, err := scanDeployment(rows)
		if err != nil {
			return nil, 0, err
		}
		result = append(result, d)
	}
	return result, len(result), nil
}

// GetByStatus retrieves deployments by status.
func (r *DeploymentRepository) GetByStatus(ctx context.Context, status deployment.DeploymentStatus) ([]*deployment.Deployment, error) {
	query := `SELECT id, tenant_id, name, description, status, config, workflow_id, error, metadata, version, created_at, updated_at
		FROM deployments WHERE status = $1`
	rows, err := r.db.QueryContext(ctx, query, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*deployment.Deployment
	for rows.Next() {
		d, err := scanDeployment(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, d)
	}
	return result, nil
}

func scanDeployment(scanner rowScanner) (*deployment.Deployment, error) {
	entity := &deployment.Deployment{}
	var configJSON, metadataJSON []byte
	if err := scanner.Scan(
		&entity.ID,
		&entity.TenantID,
		&entity.Name,
		&entity.Description,
		&entity.Status,
		&configJSON,
		&entity.WorkflowID,
		&entity.Error,
		&metadataJSON,
		&entity.Version,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(configJSON, &entity.Config); err != nil {
		return nil, fmt.Errorf("decode deployment config: %w", err)
	}
	if err := json.Unmarshal(metadataJSON, &entity.Metadata); err != nil {
		return nil, fmt.Errorf("decode deployment metadata: %w", err)
	}
	return entity, nil
}

// CountByTenant counts deployments for a tenant.
func (r *DeploymentRepository) CountByTenant(ctx context.Context, tenantID string) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM deployments WHERE tenant_id = $1`, tenantID).Scan(&count)
	return count, err
}
