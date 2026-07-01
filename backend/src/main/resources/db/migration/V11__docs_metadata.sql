-- ============================================================
-- Docs Persistence Schema for CloudBuilder (ADR-009)
-- Stores auto-documentation metadata and cross-module links
-- All tables are tenant-isolated via tenant_id column
-- ============================================================

-- ── 1. Document Metadata ────────────────────────────────────

CREATE TABLE IF NOT EXISTS doc_metadata (
    id               VARCHAR(36) NOT NULL,
    tenant_id        VARCHAR(64) NOT NULL,
    path             VARCHAR(1024) NOT NULL,
    title            VARCHAR(512),
    sha256_checksum  VARCHAR(64),
    content          TEXT,
    last_modified    TIMESTAMPTZ,
    imported_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stale            BOOLEAN DEFAULT FALSE,
    auto_generated   BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

-- Monthly partitions for 2026 (current year)
CREATE TABLE IF NOT EXISTS doc_metadata_2026_01 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_02 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_03 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_04 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_05 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_06 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_07 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_08 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_09 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_10 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_11 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE IF NOT EXISTS doc_metadata_2026_12 PARTITION OF doc_metadata
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Default partition catches all rows not matched by specific partitions
CREATE TABLE IF NOT EXISTS doc_metadata_default PARTITION OF doc_metadata DEFAULT;

-- Unique constraint on (tenant_id, path) for upsert semantics
CREATE UNIQUE INDEX IF NOT EXISTS idx_doc_metadata_tenant_path
    ON doc_metadata (tenant_id, path, created_at);

-- Lookup by tenant and title
CREATE INDEX IF NOT EXISTS idx_doc_metadata_title
    ON doc_metadata (tenant_id, title);

-- Full-text search on content (Portuguese dictionary)
CREATE INDEX IF NOT EXISTS idx_doc_metadata_fts
    ON doc_metadata USING GIN (to_tsvector('portuguese', coalesce(content, '')));

-- ── 2. Document Auto-Links ──────────────────────────────────

CREATE TABLE IF NOT EXISTS doc_auto_links (
    id            VARCHAR(36) PRIMARY KEY,
    tenant_id     VARCHAR(64) NOT NULL,
    source_path   VARCHAR(1024) NOT NULL,
    linked_path   VARCHAR(1024) NOT NULL,
    relationship  VARCHAR(64) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup by source document
CREATE INDEX IF NOT EXISTS idx_doc_auto_links_source
    ON doc_auto_links (tenant_id, source_path);

-- Lookup by linked document
CREATE INDEX IF NOT EXISTS idx_doc_auto_links_linked
    ON doc_auto_links (tenant_id, linked_path);

-- Lookup by relationship type
CREATE INDEX IF NOT EXISTS idx_doc_auto_links_relationship
    ON doc_auto_links (tenant_id, relationship);

-- Prevent duplicate link definitions
CREATE UNIQUE INDEX IF NOT EXISTS idx_doc_auto_links_unique
    ON doc_auto_links (tenant_id, source_path, linked_path, relationship);

-- ── 3. Partition Management Function ─────────────────────────

CREATE OR REPLACE FUNCTION create_doc_metadata_partition()
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    start_date     TEXT;
    end_date       TEXT;
    next_month     DATE;
BEGIN
    next_month := date_trunc('month', NOW() + INTERVAL '1 month');
    partition_name := 'doc_metadata_' || to_char(next_month, 'YYYY_MM');
    start_date := to_char(next_month, 'YYYY-MM-DD');
    end_date := to_char(next_month + INTERVAL '1 month', 'YYYY-MM-DD');

    -- Check if partition already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name
          AND n.nspname = current_schema()
    ) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF doc_metadata FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
