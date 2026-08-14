-- CloudBuilder Ephemeral Environments Schema
-- V26: Ephemeral environments for temporary preview environments

-- ============================================================================
-- EPHEMERAL_ENVIRONMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ephemeral_environments (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    repo_id VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    pr_number INTEGER,
    pr_url TEXT,
    source_environment_id VARCHAR(36) NOT NULL,
    base_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'CREATING',
    ttl_hours INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    destroyed_at TIMESTAMP WITH TIME ZONE,
    cost DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    resource_size VARCHAR(50) NOT NULL DEFAULT 'small',
    resource_config TEXT
);

CREATE INDEX IF NOT EXISTS idx_ephemeral_tenant_id ON ephemeral_environments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ephemeral_project_id ON ephemeral_environments(project_id);
CREATE INDEX IF NOT EXISTS idx_ephemeral_status ON ephemeral_environments(status);
CREATE INDEX IF NOT EXISTS idx_ephemeral_expires_at ON ephemeral_environments(expires_at);

-- ============================================================================
-- Apply updated_at trigger
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ephemeral_environments_updated_at') THEN
        CREATE TRIGGER update_ephemeral_environments_updated_at
            BEFORE UPDATE ON ephemeral_environments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
