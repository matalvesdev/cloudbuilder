-- V25: Add deployment lifecycle state machine column
-- Replaces legacy status enum with validated state machine (ADR-038)

-- Add lifecycle_state column with default for existing rows
ALTER TABLE deployments ADD COLUMN lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'REQUESTED';

-- Migrate existing status values to new lifecycle states
UPDATE deployments SET lifecycle_state = 'REQUESTED' WHERE status = 'PENDING';
UPDATE deployments SET lifecycle_state = 'DEPLOYING' WHERE status = 'IN_PROGRESS';
UPDATE deployments SET lifecycle_state = 'COMPLETED' WHERE status = 'SUCCESS';
UPDATE deployments SET lifecycle_state = 'FAILED' WHERE status = 'FAILED';
UPDATE deployments SET lifecycle_state = 'FAILED' WHERE status = 'ROLLED_BACK';

-- Add index for common queries (filter by lifecycle state)
CREATE INDEX idx_deployments_lifecycle_state ON deployments(lifecycle_state);
