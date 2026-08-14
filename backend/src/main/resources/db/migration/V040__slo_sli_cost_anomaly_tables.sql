-- SLO/SLI runtime tables + CostAnomalyResult table
-- Gap closure: Q2/Q3 audit — SLO/SLI entities and CostAnomaly persistence

-- ── SLO Definitions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS observe_slo_definitions (
    id VARCHAR(36) PRIMARY KEY,
    environment_id VARCHAR(36) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sli_type VARCHAR(50) NOT NULL,
    target_value DOUBLE PRECISION NOT NULL,
    target_unit VARCHAR(50) NOT NULL,
    window_days BIGINT NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_observe_slo_definitions_env ON observe_slo_definitions(environment_id);
CREATE INDEX IF NOT EXISTS idx_observe_slo_definitions_service ON observe_slo_definitions(service_name, environment_id);

-- ── SLI Snapshots ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS observe_sli_snapshots (
    id VARCHAR(36) PRIMARY KEY,
    slo_definition_id VARCHAR(36) NOT NULL,
    environment_id VARCHAR(36) NOT NULL,
    sli_value DOUBLE PRECISION NOT NULL,
    compliant BOOLEAN NOT NULL DEFAULT TRUE,
    details TEXT,
    measured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_observe_sli_snapshots_slo ON observe_sli_snapshots(slo_definition_id);
CREATE INDEX IF NOT EXISTS idx_observe_sli_snapshots_env ON observe_sli_snapshots(environment_id, measured_at);

-- ── Cost Anomaly Results ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cost_anomaly_results (
    id VARCHAR(36) PRIMARY KEY,
    environment_id VARCHAR(36) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    anomaly_date DATE NOT NULL,
    actual_amount DOUBLE PRECISION NOT NULL,
    expected_amount DOUBLE PRECISION NOT NULL,
    deviation_pct DOUBLE PRECISION NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    details TEXT,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cost_anomaly_env ON cost_anomaly_results(environment_id, anomaly_date DESC);
CREATE INDEX IF NOT EXISTS idx_cost_anomaly_status ON cost_anomaly_results(status);
