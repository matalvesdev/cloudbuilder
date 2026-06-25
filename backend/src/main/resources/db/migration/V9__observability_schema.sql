-- ============================================================
-- Native Observability Schema for CloudBuilder
-- All tables are tenant-isolated via tenant_id column
-- ============================================================

-- ── 1. Metrics Time-Series ─────────────────────────────────

CREATE TABLE IF NOT EXISTS metrics_ts (
    id          UUID DEFAULT gen_random_uuid(),
    tenant_id   VARCHAR(64) NOT NULL,
    metric_name VARCHAR(128) NOT NULL,
    tags        JSONB DEFAULT '{}',
    value       DOUBLE PRECISION NOT NULL,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

CREATE INDEX IF NOT EXISTS idx_metrics_lookup ON metrics_ts (tenant_id, metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_tags ON metrics_ts USING GIN (tags);

-- ── 2. Traces & Spans ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS traces (
    id           UUID DEFAULT gen_random_uuid(),
    trace_id     VARCHAR(32) NOT NULL,
    tenant_id    VARCHAR(64) NOT NULL,
    service_name VARCHAR(128) NOT NULL,
    operation    VARCHAR(256) NOT NULL,
    start_time   TIMESTAMPTZ NOT NULL,
    duration_ms  INTEGER NOT NULL,
    status_code  INTEGER NOT NULL,
    is_error     BOOLEAN DEFAULT FALSE,
    metadata     JSONB DEFAULT '{}',
    PRIMARY KEY (start_time, id)
) PARTITION BY RANGE (start_time);

CREATE TABLE IF NOT EXISTS spans (
    id              UUID DEFAULT gen_random_uuid(),
    trace_id        VARCHAR(32) NOT NULL,
    span_id         VARCHAR(16) NOT NULL,
    parent_span_id  VARCHAR(16),
    tenant_id       VARCHAR(64) NOT NULL,
    service_name    VARCHAR(128) NOT NULL,
    operation       VARCHAR(256) NOT NULL,
    start_time      TIMESTAMPTZ NOT NULL,
    duration_ms     INTEGER NOT NULL,
    status_code     INTEGER,
    status          VARCHAR(16),
    tags            JSONB DEFAULT '{}',
    PRIMARY KEY (start_time, id)
) PARTITION BY RANGE (start_time);

CREATE INDEX IF NOT EXISTS idx_traces_tenant ON traces (tenant_id, trace_id);
CREATE INDEX IF NOT EXISTS idx_traces_error ON traces (tenant_id, is_error, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_spans_trace ON spans (trace_id);

-- ── 3. Logs ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS logs (
    id           UUID DEFAULT gen_random_uuid(),
    tenant_id    VARCHAR(64) NOT NULL,
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level        VARCHAR(16) NOT NULL,
    logger_name  VARCHAR(256) NOT NULL,
    thread_name  VARCHAR(128),
    message      TEXT NOT NULL,
    trace_id     VARCHAR(32),
    span_id      VARCHAR(16),
    stack_trace  TEXT,
    structured   JSONB DEFAULT '{}',
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

CREATE INDEX IF NOT EXISTS idx_logs_lookup ON logs (tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs (tenant_id, level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_fts ON logs USING GIN (to_tsvector('portuguese', message));

-- ── 4. Alert Rules & Incidents ─────────────────────────────

CREATE TABLE IF NOT EXISTS alert_rules (
    id              UUID DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR(64) NOT NULL,
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    metric_name     VARCHAR(128) NOT NULL,
    condition       VARCHAR(16) NOT NULL,
    threshold       DOUBLE PRECISION NOT NULL,
    duration_sec    INTEGER NOT NULL DEFAULT 0,
    severity        VARCHAR(16) NOT NULL,
    enabled         BOOLEAN DEFAULT TRUE,
    notify_channels JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS alert_rule_evaluations (
    id              UUID DEFAULT gen_random_uuid(),
    alert_rule_id   UUID NOT NULL REFERENCES alert_rules(id),
    tenant_id       VARCHAR(64) NOT NULL,
    evaluated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_value   DOUBLE PRECISION,
    threshold       DOUBLE PRECISION,
    breached        BOOLEAN NOT NULL,
    PRIMARY KEY (evaluated_at, id)
) PARTITION BY RANGE (evaluated_at);

CREATE TABLE IF NOT EXISTS incidents (
    id              UUID DEFAULT gen_random_uuid(),
    alert_rule_id   UUID REFERENCES alert_rules(id),
    tenant_id       VARCHAR(64) NOT NULL,
    title           VARCHAR(256) NOT NULL,
    description     TEXT,
    severity        VARCHAR(16) NOT NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    current_value   DOUBLE PRECISION,
    threshold       DOUBLE PRECISION,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    UNIQUE (alert_rule_id, status) WHERE status = 'OPEN'
);

CREATE TABLE IF NOT EXISTS incident_timeline (
    id          UUID DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id),
    event_type  VARCHAR(32) NOT NULL,
    description TEXT,
    created_by  VARCHAR(128),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Notification Channels ───────────────────────────────

CREATE TABLE IF NOT EXISTS notification_channels (
    id        UUID DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    name      VARCHAR(128) NOT NULL,
    type      VARCHAR(32) NOT NULL,
    config    JSONB NOT NULL,
    enabled   BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, name)
);

-- ── 6. SLO Definitions ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS slo_definitions (
    id              UUID DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR(64) NOT NULL,
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    sli_type        VARCHAR(32) NOT NULL,
    metric_name     VARCHAR(128) NOT NULL,
    target_pct      DOUBLE PRECISION NOT NULL,
    window_days     INTEGER NOT NULL DEFAULT 30,
    enabled         BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS sli_snapshots (
    id              UUID DEFAULT gen_random_uuid(),
    slo_id          UUID NOT NULL REFERENCES slo_definitions(id),
    tenant_id       VARCHAR(64) NOT NULL,
    window_start    TIMESTAMPTZ NOT NULL,
    window_end      TIMESTAMPTZ NOT NULL,
    good_count      BIGINT NOT NULL,
    total_count     BIGINT NOT NULL,
    sli_pct         DOUBLE PRECISION NOT NULL,
    error_budget_pct DOUBLE PRECISION,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. Dashboard Definitions ───────────────────────────────

CREATE TABLE IF NOT EXISTS dashboards (
    id          UUID DEFAULT gen_random_uuid(),
    tenant_id   VARCHAR(64) NOT NULL,
    name        VARCHAR(128) NOT NULL,
    description TEXT,
    definition  JSONB NOT NULL,
    is_default  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);
