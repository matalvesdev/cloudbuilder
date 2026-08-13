package postgres

import (
	"context"
	"encoding/json"
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/audit"
)

// AuditRepository implements audit.Repository for PostgreSQL.
type AuditRepository struct {
	db *DB
}

// NewAuditRepository creates a new PostgreSQL audit repository.
func NewAuditRepository(db *DB) *AuditRepository {
	return &AuditRepository{db: db}
}

// Create inserts a new audit event.
func (r *AuditRepository) Create(ctx context.Context, e *audit.AuditEvent) error {
	detailsJSON, err := json.Marshal(e.Details)
	if err != nil {
		return err
	}

	query := `INSERT INTO audit_events (id, tenant_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err = r.db.ExecContext(ctx, query,
		e.ID, e.TenantID, e.UserID, e.Action, e.ResourceType, e.ResourceID,
		string(detailsJSON), e.IPAddress, e.UserAgent, e.CreatedAt)
	return err
}

// GetByID retrieves an audit event by ID.
func (r *AuditRepository) GetByID(ctx context.Context, id string) (*audit.AuditEvent, error) {
	query := `SELECT id, tenant_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
		FROM audit_events WHERE id = $1`
	e := &audit.AuditEvent{}
	var detailsJSON []byte
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&e.ID, &e.TenantID, &e.UserID, &e.Action, &e.ResourceType, &e.ResourceID,
		&detailsJSON, &e.IPAddress, &e.UserAgent, &e.CreatedAt)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(detailsJSON, &e.Details); err != nil {
		e.Details = make(map[string]interface{})
	}
	return e, nil
}

// ListByTenant lists audit events for a tenant.
func (r *AuditRepository) ListByTenant(ctx context.Context, tenantID string, filter audit.AuditFilter) ([]*audit.AuditEvent, int, error) {
	baseQuery := `FROM audit_events WHERE tenant_id = $1`
	args := []interface{}{tenantID}
	argIdx := 2

	if filter.Action != "" {
		baseQuery += ` AND action = $` + itoa(argIdx)
		args = append(args, filter.Action)
		argIdx++
	}
	if filter.ResourceType != "" {
		baseQuery += ` AND resource_type = $` + itoa(argIdx)
		args = append(args, filter.ResourceType)
		argIdx++
	}

	// Count
	var total int
	countQuery := `SELECT COUNT(*) ` + baseQuery
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Query
	limit := filter.Limit
	if limit <= 0 {
		limit = 50
	}
	offset := filter.Offset

	dataQuery := `SELECT id, tenant_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at ` +
		baseQuery + ` ORDER BY created_at DESC LIMIT $` + itoa(argIdx) + ` OFFSET $` + itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var result []*audit.AuditEvent
	for rows.Next() {
		e := &audit.AuditEvent{}
		var detailsJSON []byte
		if err := rows.Scan(&e.ID, &e.TenantID, &e.UserID, &e.Action, &e.ResourceType, &e.ResourceID,
			&detailsJSON, &e.IPAddress, &e.UserAgent, &e.CreatedAt); err != nil {
			return nil, 0, err
		}
		if err := json.Unmarshal(detailsJSON, &e.Details); err != nil {
			e.Details = make(map[string]interface{})
		}
		result = append(result, e)
	}
	return result, total, nil
}

// ListByResource lists audit events for a specific resource.
func (r *AuditRepository) ListByResource(ctx context.Context, resourceType, resourceID string) ([]*audit.AuditEvent, error) {
	query := `SELECT id, tenant_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
		FROM audit_events WHERE resource_type = $1 AND resource_id = $2 ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, query, resourceType, resourceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*audit.AuditEvent
	for rows.Next() {
		e := &audit.AuditEvent{}
		var detailsJSON []byte
		if err := rows.Scan(&e.ID, &e.TenantID, &e.UserID, &e.Action, &e.ResourceType, &e.ResourceID,
			&detailsJSON, &e.IPAddress, &e.UserAgent, &e.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(detailsJSON, &e.Details); err != nil {
			e.Details = make(map[string]interface{})
		}
		result = append(result, e)
	}
	return result, nil
}

func itoa(i int) string {
	return string(rune('0' + i))
}

var _ = time.Now
