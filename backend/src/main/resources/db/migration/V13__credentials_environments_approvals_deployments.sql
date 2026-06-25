-- CloudBuilder Credentials, Environments, Approvals & Deployments Schema
-- V13: Credentials, managed environments, approval rules/requests/votes, deployments

-- ============================================================================
-- CREDENTIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS credentials (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    auth_type VARCHAR(50) NOT NULL,
    encrypted_payload TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credentials_tenant_id ON credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credentials_provider ON credentials(provider);

-- ============================================================================
-- MANAGED_ENVIRONMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS managed_environments (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(50) NOT NULL,
    region VARCHAR(100),
    credentials_id VARCHAR(36) REFERENCES credentials(id),
    config_json TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_managed_env_tenant_id ON managed_environments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_managed_env_provider ON managed_environments(provider);

-- ============================================================================
-- APPROVAL_RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_rules (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    environment_id VARCHAR(36),
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    approvers_json TEXT,
    min_approvals INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- APPROVAL_REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_requests (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    environment_id VARCHAR(36),
    request_type VARCHAR(20) NOT NULL,
    requested_by VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_approval_req_env ON approval_requests(environment_id);
CREATE INDEX IF NOT EXISTS idx_approval_req_status ON approval_requests(status);

-- ============================================================================
-- APPROVAL_VOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_votes (
    id VARCHAR(36) PRIMARY KEY,
    approval_request_id VARCHAR(36) NOT NULL REFERENCES approval_requests(id),
    user_id VARCHAR(36) NOT NULL,
    vote VARCHAR(10) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_approval_votes_request_user UNIQUE(approval_request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_votes_request ON approval_votes(approval_request_id);

-- ============================================================================
-- DEPLOYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS deployments (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    environment_id VARCHAR(36),
    canvas_design_id VARCHAR(36),
    version VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    deployed_by VARCHAR(255),
    execution_log TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_deployments_env ON deployments(environment_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_tenant_id ON deployments(tenant_id);

-- ============================================================================
-- Apply updated_at triggers
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS update_credentials_updated_at
    BEFORE UPDATE ON credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_managed_environments_updated_at
    BEFORE UPDATE ON managed_environments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
