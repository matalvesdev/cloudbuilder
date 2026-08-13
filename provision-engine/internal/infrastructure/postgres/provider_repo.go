package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/provider"
)

// ProviderRepository implements provider.Repository for PostgreSQL.
type ProviderRepository struct {
	db *DB
}

// NewProviderRepository creates a new PostgreSQL provider repository.
func NewProviderRepository(db *DB) *ProviderRepository {
	return &ProviderRepository{db: db}
}

// Create inserts a new provider.
func (r *ProviderRepository) Create(ctx context.Context, p *provider.Provider) error {
	configJSON, err := json.Marshal(p.Config)
	if err != nil {
		return err
	}
	capsJSON, err := json.Marshal(p.Capabilities)
	if err != nil {
		return err
	}

	query := `INSERT INTO providers (id, tenant_id, type, name, status, config, capabilities, version, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err = r.db.ExecContext(ctx, query,
		p.ID, p.TenantID, p.Type, p.Name, p.Status,
		string(configJSON), string(capsJSON), p.Version, p.CreatedAt, p.UpdatedAt)
	return err
}

// GetByID retrieves a provider by ID.
func (r *ProviderRepository) GetByID(ctx context.Context, id string) (*provider.Provider, error) {
	query := `SELECT id, tenant_id, type, name, status, config, capabilities, version, created_at, updated_at
		FROM providers WHERE id = $1`
	return r.scanOne(r.db.QueryRowContext(ctx, query, id))
}

// GetByTypeAndTenant retrieves a provider by type and tenant.
func (r *ProviderRepository) GetByTypeAndTenant(ctx context.Context, tenantID string, providerType provider.ProviderType) (*provider.Provider, error) {
	query := `SELECT id, tenant_id, type, name, status, config, capabilities, version, created_at, updated_at
		FROM providers WHERE tenant_id = $1 AND type = $2`
	return r.scanOne(r.db.QueryRowContext(ctx, query, tenantID, providerType))
}

// Update updates a provider.
func (r *ProviderRepository) Update(ctx context.Context, p *provider.Provider) error {
	configJSON, err := json.Marshal(p.Config)
	if err != nil {
		return err
	}
	capsJSON, err := json.Marshal(p.Capabilities)
	if err != nil {
		return err
	}

	query := `UPDATE providers SET name = $2, status = $3, config = $4, capabilities = $5, version = $6, updated_at = $7 WHERE id = $1`
	_, err = r.db.ExecContext(ctx, query,
		p.ID, p.Name, p.Status, string(configJSON), string(capsJSON), p.Version, p.UpdatedAt)
	return err
}

// Delete deletes a provider.
func (r *ProviderRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM providers WHERE id = $1`, id)
	return err
}

// ListByTenant lists providers for a tenant.
func (r *ProviderRepository) ListByTenant(ctx context.Context, tenantID string) ([]*provider.Provider, error) {
	query := `SELECT id, tenant_id, type, name, status, config, capabilities, version, created_at, updated_at
		FROM providers WHERE tenant_id = $1 ORDER BY name`
	rows, err := r.db.QueryContext(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*provider.Provider
	for rows.Next() {
		p, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, nil
}

type providerScanner interface {
	Scan(dest ...interface{}) error
}

func (r *ProviderRepository) scanOne(scanner providerScanner) (*provider.Provider, error) {
	p := &provider.Provider{}
	var configJSON, capsJSON []byte
	err := scanner.Scan(&p.ID, &p.TenantID, &p.Type, &p.Name, &p.Status,
		&configJSON, &capsJSON, &p.Version, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(configJSON, &p.Config); err != nil {
		p.Config = make(map[string]string)
	}
	if err := json.Unmarshal(capsJSON, &p.Capabilities); err != nil {
		p.Capabilities = make([]provider.ProviderCapability, 0)
	}
	return p, nil
}

func (r *ProviderRepository) scanRow(scanner providerScanner) (*provider.Provider, error) {
	return r.scanOne(scanner)
}

var _ = time.Now
var _ = sql.ErrNoRows
