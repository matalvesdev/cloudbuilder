-- ============================================================================
-- V043: Fix version column type conflict + Spring Modulith events schema
-- ============================================================================
-- Problem: V042 created `version VARCHAR(64)` columns that conflict with
-- BaseEntity's @Version Long version (bigint). Hibernate's ddl-auto: update
-- tried to ALTER COLUMN and PostgreSQL rejected the implicit cast.
-- Solution: rename conflicting columns to `item_version` so the entity's
-- @Version field maps to a separate column.
-- Also: create Spring Modulith outbox event table (was previously auto-created
-- by Hibernate, but we now use ddl-auto: none).
-- ============================================================================

-- ── 1. Rename version → item_version in V042 tables ──────────────────────

-- catalog_item_versions
ALTER TABLE catalog_item_versions RENAME COLUMN version TO item_version;

-- marketplace_listings
ALTER TABLE marketplace_listings RENAME COLUMN version TO item_version;

-- marketplace_templates
ALTER TABLE marketplace_templates RENAME COLUMN version TO item_version;

-- ── 2. Spring Modulith outbox event table ─────────────────────────────────

CREATE TABLE IF NOT EXISTS spring_modulith_outbox_event (
    id              VARCHAR(36) NOT NULL PRIMARY KEY,
    created_at      TIMESTAMP NOT NULL,
    event_type      VARCHAR(255) NOT NULL,
    listener_id     VARCHAR(255) NOT NULL,
    completion_date TIMESTAMP,
    serialized_event TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_outbox_event_pending
    ON spring_modulith_outbox_event(listener_id, completion_date);
