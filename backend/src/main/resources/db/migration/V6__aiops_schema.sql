-- CloudBuilder AIOps Module Schema
-- V6: AIOps module tables (incidents)

-- ============================================================================
-- INCIDENTS TABLE
-- ============================================================================
CREATE TABLE incidents (
    id VARCHAR(36) PRIMARY KEY,
    environment_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    classification TEXT,
    suggested_rca TEXT,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_incidents_environment ON incidents(environment_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_detected_at ON incidents(detected_at);
CREATE INDEX idx_incidents_env_status ON incidents(environment_id, status);
