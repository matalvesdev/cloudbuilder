-- V41: Fix observability columns — alter JSONB to TEXT to match JPA entity String types
-- The JPA entities use @Column(columnDefinition = "TEXT DEFAULT '{}'") but V009 created
-- these columns as JSONB, causing type mismatch errors when JPA inserts varchar values.

-- metrics_ts.tags: JSONB → TEXT
ALTER TABLE metrics_ts ALTER COLUMN tags TYPE TEXT USING tags::text;
ALTER TABLE metrics_ts ALTER COLUMN tags SET DEFAULT '{}';

-- traces.metadata: JSONB → TEXT
ALTER TABLE traces ALTER COLUMN metadata TYPE TEXT USING metadata::text;
ALTER TABLE traces ALTER COLUMN metadata SET DEFAULT '{}';

-- spans.tags: JSONB → TEXT
ALTER TABLE spans ALTER COLUMN tags TYPE TEXT USING tags::text;
ALTER TABLE spans ALTER COLUMN tags SET DEFAULT '{}';

-- logs.structured: JSONB → TEXT
ALTER TABLE logs ALTER COLUMN structured TYPE TEXT USING structured::text;
ALTER TABLE logs ALTER COLUMN structured SET DEFAULT '{}';

-- alert_rules.notify_channels: JSONB → TEXT
ALTER TABLE alert_rules ALTER COLUMN notify_channels TYPE TEXT USING notify_channels::text;
ALTER TABLE alert_rules ALTER COLUMN notify_channels SET DEFAULT '[]';

-- dashboards.definition: JSONB → TEXT
ALTER TABLE dashboards ALTER COLUMN definition TYPE TEXT USING definition::text;

-- notification_channels.config: JSONB → TEXT
ALTER TABLE notification_channels ALTER COLUMN config TYPE TEXT USING config::text;
