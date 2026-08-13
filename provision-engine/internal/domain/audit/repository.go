package audit

import "context"

// Repository is the port for audit event persistence.
type Repository interface {
	Create(ctx context.Context, event *AuditEvent) error
	GetByID(ctx context.Context, id string) (*AuditEvent, error)
	ListByTenant(ctx context.Context, tenantID string, filter AuditFilter) ([]*AuditEvent, int, error)
	ListByResource(ctx context.Context, resourceType, resourceID string) ([]*AuditEvent, error)
}
