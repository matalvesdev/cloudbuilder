-- CloudBuilder Observe Module Schema
-- V3: Observe module tables (service_health, alerts)

-- ============================================================================
-- SERVICE_HEALTH TABLE
-- ============================================================================
CREATE TABLE service_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(255) NOT NULL,
    environment_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
    uptime_percent DOUBLE PRECISION NOT NULL DEFAULT 100,
    details TEXT,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_health_service ON service_health(service_name);
CREATE INDEX idx_service_health_environment ON service_health(environment_id);
CREATE INDEX idx_service_health_status ON service_health(status);
CREATE INDEX idx_service_health_checked_at ON service_health(checked_at);
CREATE INDEX idx_service_health_env_status ON service_health(environment_id, status);

-- ============================================================================
-- ALERTS TABLE
-- ============================================================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    environment_id VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    source VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_alerts_environment ON alerts(environment_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_triggered_at ON alerts(triggered_at);
CREATE INDEX idx_alerts_env_status ON alerts(environment_id, status);
