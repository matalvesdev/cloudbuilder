-- ============================================================
-- Analytics Aggregation Rollup Tables (ADR-024)
-- Pre-computed aggregates for dashboard queries
-- ============================================================

-- ── Daily Module Usage Rollup ───────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_rollup_daily (
    id          VARCHAR(36) PRIMARY KEY,
    tenant_id   VARCHAR(64) NOT NULL,
    module      VARCHAR(50) NOT NULL,
    action      VARCHAR(50) NOT NULL,
    event_count BIGINT NOT NULL DEFAULT 0,
    unique_users BIGINT NOT NULL DEFAULT 0,
    rollup_date DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, module, action, rollup_date)
);

-- ── Monthly Module Usage Rollup ─────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_rollup_monthly (
    id          VARCHAR(36) PRIMARY KEY,
    tenant_id   VARCHAR(64) NOT NULL,
    module      VARCHAR(50) NOT NULL,
    action      VARCHAR(50) NOT NULL,
    event_count BIGINT NOT NULL DEFAULT 0,
    unique_users BIGINT NOT NULL DEFAULT 0,
    rollup_month DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, module, action, rollup_month)
);

-- ── Daily User Activity Rollup ──────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_user_rollup_daily (
    id          VARCHAR(36) PRIMARY KEY,
    tenant_id   VARCHAR(64) NOT NULL,
    user_id     VARCHAR(36) NOT NULL,
    module      VARCHAR(50) NOT NULL,
    event_count BIGINT NOT NULL DEFAULT 0,
    rollup_date DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id, module, rollup_date)
);

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_rollup_daily_lookup
    ON analytics_rollup_daily (tenant_id, rollup_date DESC);

CREATE INDEX IF NOT EXISTS idx_rollup_monthly_lookup
    ON analytics_rollup_monthly (tenant_id, rollup_month DESC);

CREATE INDEX IF NOT EXISTS idx_rollup_user_daily_lookup
    ON analytics_user_rollup_daily (tenant_id, rollup_date DESC);

CREATE INDEX IF NOT EXISTS idx_rollup_user_id_lookup
    ON analytics_user_rollup_daily (tenant_id, user_id, rollup_date DESC);
