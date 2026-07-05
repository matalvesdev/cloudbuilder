-- V30: Missing tables for aiops and observability modules

-- AIOPS Post-Mortems
CREATE TABLE IF NOT EXISTS aiops_post_mortems (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    incident_id VARCHAR(36),
    summary TEXT,
    root_cause TEXT,
    impact TEXT,
    timeline TEXT,
    action_items TEXT,
    lessons_learned TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AIOPS Runbooks
CREATE TABLE IF NOT EXISTS aiops_runbooks (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    severity VARCHAR(20),
    estimated_duration_minutes INTEGER,
    automated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AIOPS Remediation Actions
CREATE TABLE IF NOT EXISTS aiops_remediation_actions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    incident_id VARCHAR(36),
    action_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AIOPS Design Templates
CREATE TABLE IF NOT EXISTS aiops_design_templates (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(100),
    category VARCHAR(100),
    resources TEXT,
    connections TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Observability Traces
CREATE TABLE IF NOT EXISTS observability_traces (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    trace_id VARCHAR(255) NOT NULL,
    service_name VARCHAR(255),
    duration_ms BIGINT,
    span_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Observability Spans
CREATE TABLE IF NOT EXISTS observability_spans (
    id VARCHAR(36) PRIMARY KEY,
    trace_id VARCHAR(255) NOT NULL,
    span_id VARCHAR(255) NOT NULL,
    parent_span_id VARCHAR(255),
    service_name VARCHAR(255),
    operation_name VARCHAR(255),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_ms BIGINT,
    status VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Observability Log Entries
CREATE TABLE IF NOT EXISTS observability_log_entries (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    level VARCHAR(20) NOT NULL,
    message TEXT,
    logger_name VARCHAR(255),
    stack_trace TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Metrics Time Series
CREATE TABLE IF NOT EXISTS metrics_time_series (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    resource_id VARCHAR(36),
    metric_name VARCHAR(255) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_ts_resource ON metrics_time_series(resource_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_ts_time ON metrics_time_series(timestamp);
