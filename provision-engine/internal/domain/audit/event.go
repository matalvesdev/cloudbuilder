package audit

import (
	"time"

	"github.com/cloudbuilder/provision-engine/internal/domain/shared"
)

// AuditEvent represents an audit log entry.
type AuditEvent struct {
	shared.AggregateRoot
	TenantID     string                 `json:"tenantId"`
	UserID       string                 `json:"userId"`
	Action       string                 `json:"action"`
	ResourceType string                 `json:"resourceType"`
	ResourceID   string                 `json:"resourceId"`
	Details      map[string]interface{} `json:"details,omitempty"`
	IPAddress    string                 `json:"ipAddress,omitempty"`
	UserAgent    string                 `json:"userAgent,omitempty"`
}

// NewAuditEvent creates a new audit event.
func NewAuditEvent(tenantID, userID, action, resourceType, resourceID string, details map[string]interface{}) *AuditEvent {
	return &AuditEvent{
		AggregateRoot: shared.NewAggregateRoot(),
		TenantID:      tenantID,
		UserID:        userID,
		Action:        action,
		ResourceType:  resourceType,
		ResourceID:    resourceID,
		Details:       details,
	}
}

// AuditFilter is used for querying audit events.
type AuditFilter struct {
	Action       string
	ResourceType string
	From         *time.Time
	To           *time.Time
	Limit        int
	Offset       int
}
