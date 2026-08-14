-- V17: Missing tables for multiregion and IAM session tracking
-- These JPA entities existed but had no Flyway migration

-- ── 1. Regions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS regions (
    id          VARCHAR(36) PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    provider    VARCHAR(50) NOT NULL,
    country     VARCHAR(50) NOT NULL,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    metadata    TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── 2. Region Health ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS region_health (
    id                     VARCHAR(36) PRIMARY KEY,
    region_code            VARCHAR(50) NOT NULL,
    status                 VARCHAR(20) NOT NULL,
    latency_ms             DOUBLE PRECISION,
    availability_percent   DOUBLE PRECISION,
    details                TEXT,
    checked_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── 3. Disaster Recovery Plans ───────────────────────────────
CREATE TABLE IF NOT EXISTS disaster_recovery_plans (
    id                   VARCHAR(36) PRIMARY KEY,
    tenant_id            VARCHAR(255) NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    description          TEXT,
    primary_region_id    VARCHAR(36) NOT NULL REFERENCES regions(id),
    dr_region_id         VARCHAR(36) NOT NULL REFERENCES regions(id),
    replication_strategy VARCHAR(50) NOT NULL,
    rpo_minutes          INTEGER NOT NULL,
    rto_minutes          INTEGER NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    failover_procedure   TEXT,
    fallback_procedure   TEXT,
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_tested_at       TIMESTAMP WITH TIME ZONE,
    last_failover_at     TIMESTAMP WITH TIME ZONE
);

-- ── 4. IAM Sessions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS iam_sessions (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(255) NOT NULL,
    token           TEXT NOT NULL,
    refresh_token   TEXT,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity   TIMESTAMP WITH TIME ZONE,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    tenant_id       VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    terminated_at   TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_iam_sessions_user ON iam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_iam_sessions_active ON iam_sessions(active);
