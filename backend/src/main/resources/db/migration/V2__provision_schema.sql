-- CloudBuilder Provision Module Schema
-- V2: Provision module tables (environments, managed_resources, terraform_templates, drift_reports)

-- ============================================================================
-- ENVIRONMENTS TABLE
-- ============================================================================
CREATE TABLE environments (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    credentials_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_environments_tenant_id ON environments(tenant_id);
CREATE INDEX idx_environments_provider ON environments(provider);
CREATE INDEX idx_environments_status ON environments(status);
CREATE UNIQUE INDEX uk_environments_tenant_name ON environments(tenant_id, name);

-- ============================================================================
-- MANAGED_RESOURCES TABLE
-- ============================================================================
CREATE TABLE managed_resources (
    id VARCHAR(36) PRIMARY KEY,
    environment_id VARCHAR(36) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    terraform_address VARCHAR(500) NOT NULL,
    resource_type VARCHAR(255) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    properties_json TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    drift_detected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_managed_resources_environment ON managed_resources(environment_id);
CREATE INDEX idx_managed_resources_address ON managed_resources(terraform_address);
CREATE INDEX idx_managed_resources_type ON managed_resources(resource_type);
CREATE INDEX idx_managed_resources_status ON managed_resources(status);
CREATE UNIQUE INDEX uk_managed_resources_env_address ON managed_resources(environment_id, terraform_address);

-- ============================================================================
-- TERRAFORM_TEMPLATES TABLE
-- ============================================================================
CREATE TABLE terraform_templates (
    id VARCHAR(36) PRIMARY KEY,
    resource_type VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(100) NOT NULL,
    template_content TEXT NOT NULL,
    variables_schema TEXT,
    outputs_schema TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_terraform_templates_provider ON terraform_templates(provider);
CREATE INDEX idx_terraform_templates_active ON terraform_templates(is_active);

-- ============================================================================
-- DRIFT_REPORTS TABLE
-- ============================================================================
CREATE TABLE drift_reports (
    id VARCHAR(36) PRIMARY KEY,
    environment_id VARCHAR(36) NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    drift_data JSONB NOT NULL,
    has_drift BOOLEAN NOT NULL DEFAULT FALSE,
    resource_count INTEGER NOT NULL DEFAULT 0,
    drifted_resource_count INTEGER NOT NULL DEFAULT 0,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'DETECTED'
);

CREATE INDEX idx_drift_reports_environment ON drift_reports(environment_id);
CREATE INDEX idx_drift_reports_status ON drift_reports(status);
CREATE INDEX idx_drift_reports_detected_at ON drift_reports(detected_at);

-- ============================================================================
-- Apply updated_at triggers
-- ============================================================================
CREATE TRIGGER update_environments_updated_at
    BEFORE UPDATE ON environments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_managed_resources_updated_at
    BEFORE UPDATE ON managed_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_terraform_templates_updated_at
    BEFORE UPDATE ON terraform_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
