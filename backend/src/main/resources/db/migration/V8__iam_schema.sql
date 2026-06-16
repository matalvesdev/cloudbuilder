-- CloudBuilder IAM Module Schema
-- V8: IAM module tables (iam_roles)

-- ============================================================================
-- IAM_ROLES TABLE
-- ============================================================================
CREATE TABLE iam_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255) NOT NULL,
    permissions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_iam_roles_tenant ON iam_roles(tenant_id);
CREATE UNIQUE INDEX uk_iam_roles_name ON iam_roles(name);
