-- V29: Squads, ApiTokens, SshKeys, UserNotifications tables

CREATE TABLE IF NOT EXISTS squads (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lead_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_squad_workspace ON squads(workspace_id);

CREATE TABLE IF NOT EXISTS api_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    token_prefix VARCHAR(20) NOT NULL,
    scopes TEXT,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_token_user ON api_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_hash ON api_tokens(token_hash);

CREATE TABLE IF NOT EXISTS ssh_keys (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL,
    fingerprint VARCHAR(255),
    last_used_at TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sshkey_user ON ssh_keys(user_id);

CREATE TABLE IF NOT EXISTS user_notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL,
    metadata TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON user_notifications(user_id, read);
