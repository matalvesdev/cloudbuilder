-- V27: Event Inbox (deduplication) and Dead Letter Queue tables

CREATE TABLE IF NOT EXISTS event_inbox (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(36),
    event_type VARCHAR(255),
    topic VARCHAR(255),
    partition_num INT,
    offset_val BIGINT,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbox_event_id ON event_inbox(event_id);
CREATE INDEX IF NOT EXISTS idx_inbox_tenant ON event_inbox(tenant_id);

CREATE TABLE IF NOT EXISTS dlq_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255),
    topic VARCHAR(255) NOT NULL,
    partition_num INT,
    offset_val BIGINT,
    payload TEXT,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dlq_topic ON dlq_events(topic);
CREATE INDEX IF NOT EXISTS idx_dlq_created ON dlq_events(created_at);
