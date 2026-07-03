-- V28: Canvas Comments table + Version status field

CREATE TABLE IF NOT EXISTS canvas_comments (
    id VARCHAR(36) PRIMARY KEY,
    canvas_id VARCHAR(36) NOT NULL,
    node_id VARCHAR(36),
    tenant_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    author_name VARCHAR(255),
    content TEXT NOT NULL,
    mention_ids TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by VARCHAR(36),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_canvas ON canvas_comments(canvas_id);
CREATE INDEX IF NOT EXISTS idx_comment_node ON canvas_comments(node_id);

-- Add status column to canvas_versions if not exists
DO $$ BEGIN
    ALTER TABLE canvas_versions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
