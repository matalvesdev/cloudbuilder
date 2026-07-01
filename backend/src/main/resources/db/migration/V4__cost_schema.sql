-- CloudBuilder Cost Module Schema
-- V4: Cost module tables (cost_records, budgets)

-- ============================================================================
-- COST_RECORDS TABLE
-- ============================================================================
CREATE TABLE cost_records (
    id VARCHAR(36) PRIMARY KEY,
    environment_id VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    date DATE NOT NULL,
    resource_id VARCHAR(255),
    tags TEXT,
    imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_records_environment ON cost_records(environment_id);
CREATE INDEX idx_cost_records_provider ON cost_records(provider);
CREATE INDEX idx_cost_records_service ON cost_records(service_name);
CREATE INDEX idx_cost_records_date ON cost_records(date);
CREATE INDEX idx_cost_records_resource ON cost_records(resource_id);
CREATE INDEX idx_cost_records_env_date ON cost_records(environment_id, date);
CREATE INDEX idx_cost_records_env_provider ON cost_records(environment_id, provider);

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================
CREATE TABLE budgets (
    id VARCHAR(36) PRIMARY KEY,
    environment_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    limit_amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    spent_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budgets_environment ON budgets(environment_id);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);
CREATE UNIQUE INDEX uk_budgets_env_name ON budgets(environment_id, name);
