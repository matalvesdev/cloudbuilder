-- V41: Fix observability columns — alter JSONB to TEXT to match JPA entity String types
-- NOTE: Must drop all GIN indexes on these tables before converting JSONB→TEXT

-- Step 1: Drop ALL GIN indexes on affected tables (catches any name pattern)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname || '.' || tablename AS tbl, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('metrics_ts', 'traces', 'spans', 'logs', 'alert_rules', 'dashboards', 'notification_channels')
      AND indexdef LIKE '%gin%'
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
  END LOOP;
END $$;

-- Also drop any index with 'gin' in the definition on these tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname AS indexname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    JOIN pg_class t ON t.oid = i.indrelid
    WHERE c.relkind = 'i'
      AND pg_get_indexdef(c.oid) LIKE '%gin%'
      AND t.relname IN ('metrics_ts', 'traces', 'spans', 'logs', 'alert_rules', 'dashboards', 'notification_channels')
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.nspname) || '.' || quote_ident(r.indexname);
  END LOOP;
END $$;

-- Step 2: Convert columns JSONB → TEXT
ALTER TABLE metrics_ts ALTER COLUMN tags TYPE TEXT USING tags::text;
ALTER TABLE metrics_ts ALTER COLUMN tags SET DEFAULT '{}';

ALTER TABLE traces ALTER COLUMN metadata TYPE TEXT USING metadata::text;
ALTER TABLE traces ALTER COLUMN metadata SET DEFAULT '{}';

ALTER TABLE spans ALTER COLUMN tags TYPE TEXT USING tags::text;
ALTER TABLE spans ALTER COLUMN tags SET DEFAULT '{}';

ALTER TABLE logs ALTER COLUMN structured TYPE TEXT USING structured::text;
ALTER TABLE logs ALTER COLUMN structured SET DEFAULT '{}';

ALTER TABLE alert_rules ALTER COLUMN notify_channels TYPE TEXT USING notify_channels::text;
ALTER TABLE alert_rules ALTER COLUMN notify_channels SET DEFAULT '[]';

ALTER TABLE dashboards ALTER COLUMN definition TYPE TEXT USING definition::text;

ALTER TABLE notification_channels ALTER COLUMN config TYPE TEXT USING config::text;
