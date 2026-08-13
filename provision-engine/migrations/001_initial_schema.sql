-- CloudBuilder Provision Engine — Initial Schema
-- Migration 001: Core tables

CREATE TABLE IF NOT EXISTS deployments (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    config JSONB,
    workflow_id VARCHAR(36),
    error TEXT,
    metadata JSONB,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deployments_tenant ON deployments(tenant_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_created ON deployments(created_at DESC);

CREATE TABLE IF NOT EXISTS workflows (
    id VARCHAR(36) PRIMARY KEY,
    deployment_id VARCHAR(36) NOT NULL REFERENCES deployments(id),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    current_batch INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflows_deployment ON workflows(deployment_id);
CREATE INDEX idx_workflows_status ON workflows(status);

CREATE TABLE IF NOT EXISTS workflow_steps (
    id VARCHAR(36) PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL REFERENCES workflows(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    resource_id VARCHAR(36),
    config JSONB,
    depends_on TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    result JSONB,
    retry_max INTEGER NOT NULL DEFAULT 3,
    timeout_seconds BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);

CREATE TABLE IF NOT EXISTS executions (
    id VARCHAR(36) PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL REFERENCES workflows(id),
    step_id VARCHAR(36) NOT NULL,
    executor_type VARCHAR(32) NOT NULL,
    provider_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    plan JSONB,
    result JSONB,
    work_dir TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    logs TEXT,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_workflow ON executions(workflow_id);
CREATE INDEX idx_executions_status ON executions(status);

CREATE TABLE IF NOT EXISTS managed_resources (
    id VARCHAR(36) PRIMARY KEY,
    deployment_id VARCHAR(36) NOT NULL REFERENCES deployments(id),
    tenant_id VARCHAR(36) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    type VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    state VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    config JSONB,
    dependencies TEXT,
    metadata JSONB,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_by VARCHAR(36),
    locked_at TIMESTAMP WITH TIME ZONE,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_deployment ON managed_resources(deployment_id);
CREATE INDEX idx_resources_tenant ON managed_resources(tenant_id);
CREATE INDEX idx_resources_provider ON managed_resources(tenant_id, provider);
CREATE INDEX idx_resources_state ON managed_resources(state);
CREATE INDEX idx_resources_locked ON managed_resources(is_locked) WHERE is_locked = TRUE;

CREATE TABLE IF NOT EXISTS state_entries (
    id VARCHAR(36) PRIMARY KEY,
    resource_id VARCHAR(36) NOT NULL REFERENCES managed_resources(id),
    deployment_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    desired_state JSONB NOT NULL DEFAULT '{}',
    current_state JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_state_resource ON state_entries(resource_id);
CREATE INDEX idx_state_status ON state_entries(status);
CREATE INDEX idx_state_resource_version ON state_entries(resource_id, version DESC);

CREATE TABLE IF NOT EXISTS providers (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    type VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    config JSONB,
    capabilities JSONB,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_providers_tenant ON providers(tenant_id);
CREATE UNIQUE INDEX idx_providers_type_tenant ON providers(tenant_id, type);

CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(36),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_events(tenant_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit_events(action, created_at DESC);
