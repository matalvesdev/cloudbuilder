package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
)

// ResourceRepository implements resource.Repository for PostgreSQL.
type ResourceRepository struct {
	db *DB
}

// NewResourceRepository creates a new PostgreSQL resource repository.
func NewResourceRepository(db *DB) *ResourceRepository {
	return &ResourceRepository{db: db}
}

// Create inserts a new managed resource.
func (r *ResourceRepository) Create(ctx context.Context, res *resource.ManagedResource) error {
	configJSON, err := json.Marshal(res.Config)
	if err != nil {
		return err
	}
	metadataJSON, err := json.Marshal(res.Metadata)
	if err != nil {
		return err
	}
	query := `INSERT INTO managed_resources (id, deployment_id, tenant_id, provider, type, name, address, state, config, dependencies, metadata, is_locked, version, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
	_, err = r.db.ExecContext(ctx, query,
		res.ID, res.DeploymentID, res.TenantID, res.Provider, res.Type, res.Name,
		res.Address, res.State, string(configJSON), joinComma(res.Dependencies),
		string(metadataJSON), res.IsLocked(), res.Version, res.CreatedAt, res.UpdatedAt)
	return err
}

// GetByID retrieves a resource by ID.
func (r *ResourceRepository) GetByID(ctx context.Context, id string) (*resource.ManagedResource, error) {
	query := `SELECT id, deployment_id, tenant_id, provider, type, name, address, state, config, dependencies, metadata, version, created_at, updated_at
		FROM managed_resources WHERE id = $1`
	return scanResource(r.db.QueryRowContext(ctx, query, id))
}

// GetByAddress retrieves a resource by its cloud address.
func (r *ResourceRepository) GetByAddress(ctx context.Context, address string) (*resource.ManagedResource, error) {
	query := `SELECT id, deployment_id, tenant_id, provider, type, name, address, state, config, dependencies, metadata, version, created_at, updated_at
		FROM managed_resources WHERE address = $1`
	return scanResource(r.db.QueryRowContext(ctx, query, address))
}

// Update updates a resource.
func (r *ResourceRepository) Update(ctx context.Context, res *resource.ManagedResource) error {
	configJSON, err := json.Marshal(res.Config)
	if err != nil {
		return err
	}
	metadataJSON, err := json.Marshal(res.Metadata)
	if err != nil {
		return err
	}
	query := `UPDATE managed_resources SET provider = $2, type = $3, name = $4,
		address = $5, state = $6, config = $7, dependencies = $8,
		metadata = $9, version = $10, updated_at = $11 WHERE id = $1`
	_, err = r.db.ExecContext(ctx, query,
		res.ID, res.Provider, res.Type, res.Name, res.Address, res.State,
		string(configJSON), joinComma(res.Dependencies), string(metadataJSON),
		res.Version, res.UpdatedAt)
	return err
}

// Delete deletes a resource.
func (r *ResourceRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM managed_resources WHERE id = $1`, id)
	return err
}

// ListByDeploymentID lists resources for a deployment.
func (r *ResourceRepository) ListByDeploymentID(ctx context.Context, deploymentID string) ([]*resource.ManagedResource, error) {
	query := `SELECT id, deployment_id, tenant_id, provider, type, name, address, state, config, dependencies, metadata, version, created_at, updated_at
		FROM managed_resources WHERE deployment_id = $1 ORDER BY created_at`
	return r.listQuery(ctx, query, deploymentID)
}

// ListByProvider lists resources for a provider.
func (r *ResourceRepository) ListByProvider(ctx context.Context, tenantID, provider string) ([]*resource.ManagedResource, error) {
	query := `SELECT id, deployment_id, tenant_id, provider, type, name, address, state, config, dependencies, metadata, version, created_at, updated_at
		FROM managed_resources WHERE tenant_id = $1 AND provider = $2 ORDER BY created_at`
	return r.listQuery(ctx, query, tenantID, provider)
}

// ListByState lists resources by state.
func (r *ResourceRepository) ListByState(ctx context.Context, state resource.ResourceState) ([]*resource.ManagedResource, error) {
	query := `SELECT id, deployment_id, tenant_id, provider, type, name, address, state, config, dependencies, metadata, version, created_at, updated_at
		FROM managed_resources WHERE state = $1 ORDER BY created_at`
	return r.listQuery(ctx, query, state)
}

// CountByTenant counts resources for a tenant.
func (r *ResourceRepository) CountByTenant(ctx context.Context, tenantID string) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM managed_resources WHERE tenant_id = $1`, tenantID).Scan(&count)
	return count, err
}

func (r *ResourceRepository) listQuery(ctx context.Context, query string, args ...interface{}) ([]*resource.ManagedResource, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*resource.ManagedResource
	for rows.Next() {
		res, err := scanResource(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, res)
	}
	return result, nil
}

func scanResource(scanner rowScanner) (*resource.ManagedResource, error) {
	entity := &resource.ManagedResource{}
	var configJSON, metadataJSON []byte
	var dependencies string
	if err := scanner.Scan(
		&entity.ID,
		&entity.DeploymentID,
		&entity.TenantID,
		&entity.Provider,
		&entity.Type,
		&entity.Name,
		&entity.Address,
		&entity.State,
		&configJSON,
		&dependencies,
		&metadataJSON,
		&entity.Version,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(configJSON, &entity.Config); err != nil {
		return nil, fmt.Errorf("decode resource config: %w", err)
	}
	if err := json.Unmarshal(metadataJSON, &entity.Metadata); err != nil {
		return nil, fmt.Errorf("decode resource metadata: %w", err)
	}
	entity.Dependencies = splitComma(dependencies)
	return entity, nil
}

func joinComma(ss []string) string {
	if len(ss) == 0 {
		return ""
	}
	result := ss[0]
	for _, s := range ss[1:] {
		result += "," + s
	}
	return result
}

var _ = time.Now
var _ = sql.ErrNoRows
