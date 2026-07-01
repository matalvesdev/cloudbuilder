-- CloudBuilder Initial Design Module Schema
-- V1: Design module tables (canvases, nodes, edges, versions, component_definitions)

-- ============================================================================
-- CANVASES TABLE
-- ============================================================================
CREATE TABLE canvases (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    design_version INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_canvases_tenant_id ON canvases(tenant_id);
CREATE INDEX idx_canvases_created_by ON canvases(created_by);

-- ============================================================================
-- CANVAS_NODES TABLE
-- ============================================================================
CREATE TABLE canvas_nodes (
    id VARCHAR(36) PRIMARY KEY,
    canvas_id VARCHAR(36) NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    component_definition_id VARCHAR(255) NOT NULL,
    position_x DOUBLE PRECISION NOT NULL,
    position_y DOUBLE PRECISION NOT NULL,
    properties TEXT,
    validation_status VARCHAR(50),
    validation_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_canvas_nodes_canvas_id ON canvas_nodes(canvas_id);
CREATE INDEX idx_canvas_nodes_component_def ON canvas_nodes(component_definition_id);

-- ============================================================================
-- CANVAS_EDGES TABLE
-- ============================================================================
CREATE TABLE canvas_edges (
    id VARCHAR(36) PRIMARY KEY,
    canvas_id VARCHAR(36) NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    source_node_id VARCHAR(36) NOT NULL,
    target_node_id VARCHAR(36) NOT NULL,
    edge_type VARCHAR(50) NOT NULL DEFAULT 'default',
    properties TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_canvas_edges_canvas_id ON canvas_edges(canvas_id);
CREATE INDEX idx_canvas_edges_source ON canvas_edges(source_node_id);
CREATE INDEX idx_canvas_edges_target ON canvas_edges(target_node_id);

-- ============================================================================
-- CANVAS_VERSIONS TABLE
-- ============================================================================
CREATE TABLE canvas_versions (
    id VARCHAR(36) PRIMARY KEY,
    canvas_id VARCHAR(36) NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    snapshot TEXT,
    change_description VARCHAR(500),
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_canvas_versions_canvas_id ON canvas_versions(canvas_id);
CREATE UNIQUE INDEX uk_canvas_versions_canvas_version ON canvas_versions(canvas_id, version);

-- ============================================================================
-- COMPONENT_DEFINITIONS TABLE
-- ============================================================================
CREATE TABLE component_definitions (
    id VARCHAR(36) PRIMARY KEY,
    provider VARCHAR(100) NOT NULL,
    resource_type VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    properties_schema TEXT,
    terraform_template TEXT,
    validation_rules TEXT,
    cost_model TEXT,
    tags TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_component_definitions_provider ON component_definitions(provider);
CREATE INDEX idx_component_definitions_category ON component_definitions(category);
CREATE INDEX idx_component_definitions_active ON component_definitions(is_active);

-- ============================================================================
-- Updated at trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_canvases_updated_at
    BEFORE UPDATE ON canvases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_component_definitions_updated_at
    BEFORE UPDATE ON component_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
