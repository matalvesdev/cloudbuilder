-- CloudBuilder Platform Module Schema
-- V5: Platform module tables (catalog_items)

-- ============================================================================
-- CATALOG_ITEMS TABLE
-- ============================================================================
CREATE TABLE catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    schema TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_catalog_items_type ON catalog_items(type);
CREATE INDEX idx_catalog_items_status ON catalog_items(status);
CREATE INDEX idx_catalog_items_name ON catalog_items(name);
