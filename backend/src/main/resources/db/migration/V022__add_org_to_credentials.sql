-- V22: Add organization_id to credentials
ALTER TABLE credentials ADD COLUMN organization_id VARCHAR(36);
CREATE INDEX idx_credentials_organization_id ON credentials(organization_id);
