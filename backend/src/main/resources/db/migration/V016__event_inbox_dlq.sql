-- V16: Event Inbox (Inbox Pattern) + Dead Letter Queue (ADR-035)

-- Inbox for event deduplication
CREATE TABLE event_inbox (
    event_id VARCHAR(100) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSED',
    tenant_id VARCHAR(36)
);

CREATE INDEX idx_event_inbox_tenant ON event_inbox(tenant_id);
CREATE INDEX idx_event_inbox_processed ON event_inbox(processed_at);

-- Dead Letter Queue for failed events
CREATE TABLE dlq_events (
    id VARCHAR(100) PRIMARY KEY,
    original_topic VARCHAR(100) NOT NULL,
    original_partition INT NOT NULL,
    original_offset BIGINT NOT NULL,
    payload TEXT NOT NULL,
    failure_reason TEXT,
    failed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    tenant_id VARCHAR(36)
);

CREATE INDEX idx_dlq_events_topic ON dlq_events(original_topic);
CREATE INDEX idx_dlq_events_failed ON dlq_events(failed_at);
