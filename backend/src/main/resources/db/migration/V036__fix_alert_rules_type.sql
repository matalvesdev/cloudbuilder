-- V36: Fix column type mismatches between DB and JPA entities
-- alert_rules.notify_channels: DB has JSONB, entity expects TEXT

DROP TABLE IF EXISTS alert_rule_evaluations CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;

CREATE TABLE alert_rules (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    metric_name VARCHAR(128) NOT NULL,
    condition VARCHAR(16) NOT NULL,
    threshold DOUBLE PRECISION NOT NULL,
    duration_sec INTEGER NOT NULL,
    severity VARCHAR(16) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notify_channels TEXT DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

CREATE TABLE alert_rule_evaluations (
    id VARCHAR(36) PRIMARY KEY,
    alert_rule_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    evaluated_at TIMESTAMP NOT NULL,
    current_value DOUBLE PRECISION,
    threshold DOUBLE PRECISION,
    breached BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant_v2 ON alert_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alert_evaluations_v2 ON alert_rule_evaluations(alert_rule_id, evaluated_at);
