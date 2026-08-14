-- V27: Event Inbox (deduplication) and Dead Letter Queue tables
-- Handles both new tables and existing tables with missing columns

DO $$
BEGIN
    -- Create event_inbox if not exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'event_inbox') THEN
        CREATE TABLE event_inbox (
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
    ELSE
        ALTER TABLE event_inbox ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
        ALTER TABLE event_inbox ADD COLUMN IF NOT EXISTS partition_num INT;
        ALTER TABLE event_inbox ADD COLUMN IF NOT EXISTS offset_val BIGINT;
        ALTER TABLE event_inbox ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    END IF;

    CREATE INDEX IF NOT EXISTS idx_inbox_event_id ON event_inbox(event_id);
    CREATE INDEX IF NOT EXISTS idx_inbox_tenant ON event_inbox(tenant_id);

    -- Create dlq_events if not exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'dlq_events') THEN
        CREATE TABLE dlq_events (
            id BIGSERIAL PRIMARY KEY,
            event_id VARCHAR(255),
            topic VARCHAR(255),
            partition_num INT,
            offset_val BIGINT,
            payload TEXT,
            error_message TEXT,
            retry_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        );
    ELSE
        ALTER TABLE dlq_events ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
        ALTER TABLE dlq_events ADD COLUMN IF NOT EXISTS partition_num INT;
        ALTER TABLE dlq_events ADD COLUMN IF NOT EXISTS offset_val BIGINT;
        ALTER TABLE dlq_events ADD COLUMN IF NOT EXISTS payload TEXT;
        ALTER TABLE dlq_events ADD COLUMN IF NOT EXISTS error_message TEXT;
        ALTER TABLE dlq_events ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
        ALTER TABLE dlq_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    END IF;

    -- Only create indexes if columns exist
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dlq_events' AND column_name = 'topic') THEN
        CREATE INDEX IF NOT EXISTS idx_dlq_topic ON dlq_events(topic);
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dlq_events' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_dlq_created ON dlq_events(created_at);
    END IF;
END $$;
