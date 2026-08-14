-- V35: Comprehensive schema fix — drop wrong tables, add missing columns, create missing tables
-- Based on complete entity/@Table analysis of all JPA entities in aiops + observability modules

-- ============================================================
-- 1. Drop wrongly-named V30 tables (empty, never had data)
-- ============================================================
DROP TABLE IF EXISTS observability_traces CASCADE;
DROP TABLE IF EXISTS observability_spans CASCADE;
DROP TABLE IF EXISTS observability_log_entries CASCADE;
DROP TABLE IF EXISTS metrics_time_series CASCADE;

-- ============================================================
-- 2. Fix existing AIOps tables — add missing columns
-- ============================================================

-- aiops_post_mortems (V30 had 12 cols, entity needs 17)
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS severity VARCHAR(20);
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS generated_by VARCHAR(36);
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

-- aiops_runbooks (V30 had 10 cols, entity needs 10 — check for tags)
ALTER TABLE aiops_runbooks ADD COLUMN IF NOT EXISTS tags TEXT;

-- aiops_remediation_actions (V30 had 6 cols, entity needs 14)
ALTER TABLE aiops_remediation_actions ADD COLUMN IF NOT EXISTS script TEXT;
ALTER TABLE aiops_remediation_actions ADD COLUMN IF NOT EXISTS is_ai_suggested BOOLEAN DEFAULT FALSE;
ALTER TABLE aiops_remediation_actions ADD COLUMN IF NOT EXISTS executed_by VARCHAR(36);
ALTER TABLE aiops_remediation_actions ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP;
ALTER TABLE aiops_remediation_actions ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE aiops_remediation_actions ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE aiops_remediation_actions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- ============================================================
-- 3. Create correctly-named observability tables (from entities)
-- ============================================================

-- traces (entity: TraceEntity, @Table("traces"))
CREATE TABLE IF NOT EXISTS traces (
    id VARCHAR(36) PRIMARY KEY,
    trace_id VARCHAR(32) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    service_name VARCHAR(128) NOT NULL,
    operation VARCHAR(256) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    duration_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    is_error BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

-- spans (entity: SpanEntity, @Table("spans"))
CREATE TABLE IF NOT EXISTS spans (
    id VARCHAR(36) PRIMARY KEY,
    trace_id VARCHAR(32) NOT NULL,
    span_id VARCHAR(16) NOT NULL,
    parent_span_id VARCHAR(16),
    tenant_id VARCHAR(64) NOT NULL,
    service_name VARCHAR(128) NOT NULL,
    operation VARCHAR(256) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    duration_ms INTEGER NOT NULL,
    status_code INTEGER,
    status VARCHAR(16),
    tags JSONB DEFAULT '{}'
);

-- logs (entity: LogEntryEntity, @Table("logs"))
CREATE TABLE IF NOT EXISTS logs (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    level VARCHAR(16) NOT NULL,
    logger_name VARCHAR(256) NOT NULL,
    thread_name VARCHAR(128),
    message TEXT NOT NULL,
    trace_id VARCHAR(32),
    span_id VARCHAR(16),
    stack_trace TEXT,
    structured JSONB DEFAULT '{}'
);

-- metrics_ts (entity: MetricsTsEntity, @Table("metrics_ts"))
CREATE TABLE IF NOT EXISTS metrics_ts (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    metric_name VARCHAR(128) NOT NULL,
    tags JSONB DEFAULT '{}',
    value DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

-- ============================================================
-- 4. Create all missing AIOps tables
-- ============================================================

-- incidents (entity: Incident, @Table("incidents"))
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(36) PRIMARY KEY,
    environment_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    classification TEXT,
    suggested_rca TEXT,
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- diagnosis_results (entity: DiagnosisResult, @Table("diagnosis_results"))
CREATE TABLE IF NOT EXISTS diagnosis_results (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) NOT NULL,
    root_cause TEXT NOT NULL,
    confidence VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    recommended_action TEXT,
    affected_resources TEXT,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. Create all missing Observability tables
-- ============================================================

-- observability_incidents (entity: IncidentEntity)
CREATE TABLE IF NOT EXISTS observability_incidents (
    id VARCHAR(36) PRIMARY KEY,
    alert_rule_id VARCHAR(36),
    tenant_id VARCHAR(64) NOT NULL,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    severity VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    current_value DOUBLE PRECISION,
    threshold DOUBLE PRECISION,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    UNIQUE (alert_rule_id, status)
);

-- notification_channels (entity: NotificationChannelEntity)
CREATE TABLE IF NOT EXISTS notification_channels (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,
    config TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (tenant_id, name)
);

-- dashboards (entity: DashboardEntity)
CREATE TABLE IF NOT EXISTS dashboards (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    definition TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

-- alert_rules (entity: AlertRuleEntity)
CREATE TABLE IF NOT EXISTS alert_rules (
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

-- slo_definitions (entity: SloDefinitionEntity)
CREATE TABLE IF NOT EXISTS slo_definitions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    sli_type VARCHAR(32) NOT NULL,
    metric_name VARCHAR(128) NOT NULL,
    target_pct DOUBLE PRECISION NOT NULL,
    window_days INTEGER NOT NULL DEFAULT 30,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (tenant_id, name)
);

-- sli_snapshots (entity: SloSnapshotEntity)
CREATE TABLE IF NOT EXISTS sli_snapshots (
    id VARCHAR(36) PRIMARY KEY,
    slo_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    good_count BIGINT NOT NULL,
    total_count BIGINT NOT NULL,
    sli_pct DOUBLE PRECISION NOT NULL,
    error_budget_pct DOUBLE PRECISION,
    computed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- incident_timeline (entity: IncidentTimelineEntity)
CREATE TABLE IF NOT EXISTS incident_timeline (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    description TEXT,
    created_by VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- alert_rule_evaluations (entity: AlertRuleEvaluationEntity)
CREATE TABLE IF NOT EXISTS alert_rule_evaluations (
    id VARCHAR(36) PRIMARY KEY,
    alert_rule_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    evaluated_at TIMESTAMP NOT NULL,
    current_value DOUBLE PRECISION,
    threshold DOUBLE PRECISION,
    breached BOOLEAN NOT NULL
);

-- ============================================================
-- 6. Indexes for query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_traces_tenant ON traces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_traces_service ON traces(service_name, start_time);
CREATE INDEX IF NOT EXISTS idx_spans_trace ON spans(trace_id);
CREATE INDEX IF NOT EXISTS idx_spans_tenant ON spans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logs_tenant ON logs(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level, timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_ts_tenant ON metrics_ts(tenant_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_incidents_env ON incidents(environment_id, status);
CREATE INDEX IF NOT EXISTS idx_diagnosis_incident ON diagnosis_results(incident_id);
CREATE INDEX IF NOT EXISTS idx_obs_incidents_tenant ON observability_incidents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant ON alert_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_slo_defs_tenant ON slo_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sli_snapshots_slo ON sli_snapshots(slo_id);
CREATE INDEX IF NOT EXISTS idx_incident_timeline ON incident_timeline(incident_id, created_at);
CREATE INDEX IF NOT EXISTS idx_alert_evaluations ON alert_rule_evaluations(alert_rule_id, evaluated_at);
