package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/state"
)

// StateRepository implements state.Repository for PostgreSQL.
type StateRepository struct {
	db *DB
}

// NewStateRepository creates a new PostgreSQL state repository.
func NewStateRepository(db *DB) *StateRepository {
	return &StateRepository{db: db}
}

// Create inserts a new state entry.
func (r *StateRepository) Create(ctx context.Context, s *state.StateEntry) error {
	desiredJSON, err := json.Marshal(s.DesiredState)
	if err != nil {
		return err
	}
	currentJSON, err := json.Marshal(s.CurrentState)
	if err != nil {
		return err
	}

	query := `INSERT INTO state_entries (id, resource_id, deployment_id, tenant_id, desired_state, current_state, status, version, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err = r.db.ExecContext(ctx, query,
		s.ID, s.ResourceID, s.DeploymentID, s.TenantID,
		string(desiredJSON), string(currentJSON), s.Status, s.Version,
		s.CreatedAt, s.UpdatedAt)
	return err
}

// GetByID retrieves a state entry by ID.
func (r *StateRepository) GetByID(ctx context.Context, id string) (*state.StateEntry, error) {
	query := `SELECT id, resource_id, deployment_id, tenant_id, desired_state, current_state, status, version, created_at, updated_at
		FROM state_entries WHERE id = $1`
	return r.scanOne(r.db.QueryRowContext(ctx, query, id))
}

// GetByResourceID retrieves state for a resource.
func (r *StateRepository) GetByResourceID(ctx context.Context, resourceID string) (*state.StateEntry, error) {
	query := `SELECT id, resource_id, deployment_id, tenant_id, desired_state, current_state, status, version, created_at, updated_at
		FROM state_entries WHERE resource_id = $1 ORDER BY version DESC LIMIT 1`
	return r.scanOne(r.db.QueryRowContext(ctx, query, resourceID))
}

// Update updates a state entry.
func (r *StateRepository) Update(ctx context.Context, s *state.StateEntry) error {
	currentJSON, err := json.Marshal(s.CurrentState)
	if err != nil {
		return err
	}

	query := `UPDATE state_entries SET current_state = $2, status = $3, version = $4, updated_at = $5 WHERE id = $1`
	_, err = r.db.ExecContext(ctx, query,
		s.ID, string(currentJSON), s.Status, s.Version, s.UpdatedAt)
	return err
}

// GetVersion retrieves a specific version of state.
func (r *StateRepository) GetVersion(ctx context.Context, resourceID string, version int) (*state.StateEntry, error) {
	query := `SELECT id, resource_id, deployment_id, tenant_id, desired_state, current_state, status, version, created_at, updated_at
		FROM state_entries WHERE resource_id = $1 AND version = $2`
	return r.scanOne(r.db.QueryRowContext(ctx, query, resourceID, version))
}

// ListVersions lists all versions for a resource.
func (r *StateRepository) ListVersions(ctx context.Context, resourceID string) ([]state.StateVersion, error) {
	query := `SELECT version, current_state, status, created_at
		FROM state_entries WHERE resource_id = $1 ORDER BY version DESC`
	rows, err := r.db.QueryContext(ctx, query, resourceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var versions []state.StateVersion
	for rows.Next() {
		v := state.StateVersion{}
		var stateJSON []byte
		var status string
		if err := rows.Scan(&v.Version, &stateJSON, &status, &v.CreatedAt); err != nil {
			return nil, err
		}
		var stateMap map[string]interface{}
		if err := json.Unmarshal(stateJSON, &stateMap); err == nil {
			v.State = stateMap
		}
		v.Trigger = status
		versions = append(versions, v)
	}
	return versions, nil
}

// ListByStatus lists state entries by status.
func (r *StateRepository) ListByStatus(ctx context.Context, status state.StateStatus) ([]*state.StateEntry, error) {
	query := `SELECT id, resource_id, deployment_id, tenant_id, desired_state, current_state, status, version, created_at, updated_at
		FROM state_entries WHERE status = $1 ORDER BY created_at`
	rows, err := r.db.QueryContext(ctx, query, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*state.StateEntry
	for rows.Next() {
		s, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, nil
}

func (r *StateRepository) scanOne(row *sql.Row) (*state.StateEntry, error) {
	s := &state.StateEntry{}
	var desiredJSON, currentJSON []byte
	err := row.Scan(&s.ID, &s.ResourceID, &s.DeploymentID, &s.TenantID,
		&desiredJSON, &currentJSON, &s.Status, &s.Version,
		&s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(desiredJSON, &s.DesiredState); err != nil {
		s.DesiredState = make(map[string]interface{})
	}
	if err := json.Unmarshal(currentJSON, &s.CurrentState); err != nil {
		s.CurrentState = make(map[string]interface{})
	}
	return s, nil
}

type rowScanner interface {
	Scan(dest ...interface{}) error
}

func (r *StateRepository) scanRow(scanner rowScanner) (*state.StateEntry, error) {
	s := &state.StateEntry{}
	var desiredJSON, currentJSON []byte
	err := scanner.Scan(&s.ID, &s.ResourceID, &s.DeploymentID, &s.TenantID,
		&desiredJSON, &currentJSON, &s.Status, &s.Version,
		&s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(desiredJSON, &s.DesiredState); err != nil {
		s.DesiredState = make(map[string]interface{})
	}
	if err := json.Unmarshal(currentJSON, &s.CurrentState); err != nil {
		s.CurrentState = make(map[string]interface{})
	}
	return s, nil
}

var _ = time.Now
