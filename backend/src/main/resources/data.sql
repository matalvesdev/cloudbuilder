-- ============================================================================
-- CloudBuilder Seed Data
-- ============================================================================
-- Runs after Flyway migrations. Idempotent (uses INSERT ... ON CONFLICT).
--
-- Default login:
--   Email: admin@cloudbuilder.dev
--   Password: Admin@123
-- ============================================================================

-- ── 1. Tenant (Organização) ────────────────────────────────────────────────
INSERT INTO tenants (id, name, slug, active, created_at, updated_at)
VALUES ('tenant-seed-001', 'CloudBuilder Demo', 'cloudbuilder-demo', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Roles ───────────────────────────────────────────────────────────────
INSERT INTO roles (id, tenant_id, name, description, is_system_role, created_at)
VALUES
    ('role-seed-admin', 'tenant-seed-001', 'admin', 'Administrador com acesso total', TRUE, CURRENT_TIMESTAMP),
    ('role-seed-editor', 'tenant-seed-001', 'editor', 'Editor com permissões de leitura e escrita', TRUE, CURRENT_TIMESTAMP),
    ('role-seed-viewer', 'tenant-seed-001', 'viewer', 'Visualizador com acesso somente leitura', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Permissions (Admin) ─────────────────────────────────────────────────
-- Resources: CANVAS, PROVISION, COST, OBSERVE, PLATFORM, IAM, AUDIT, SETTINGS
-- Actions: CREATE, READ, UPDATE, DELETE, DEPLOY, MANAGE
INSERT INTO permissions (id, role_id, resource, action)
SELECT
    'perm-admin-' || r.resource || '-' || r.action,
    'role-seed-admin',
    r.resource,
    r.action
FROM (VALUES
    ('CANVAS'), ('PROVISION'), ('COST'), ('OBSERVE'),
    ('PLATFORM'), ('IAM'), ('AUDIT'), ('SETTINGS')
) AS resources(resource)
CROSS JOIN (VALUES ('CREATE'), ('READ'), ('UPDATE'), ('DELETE'), ('DEPLOY'), ('MANAGE')) AS actions(action)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Permissions (Editor) ────────────────────────────────────────────────
INSERT INTO permissions (id, role_id, resource, action)
SELECT
    'perm-editor-' || r.resource || '-' || r.action,
    'role-seed-editor',
    r.resource,
    r.action
FROM (VALUES
    ('CANVAS'), ('PROVISION'), ('COST'), ('OBSERVE'),
    ('PLATFORM'), ('IAM'), ('AUDIT'), ('SETTINGS')
) AS resources(resource)
CROSS JOIN (VALUES ('CREATE'), ('READ'), ('UPDATE'), ('DELETE'), ('DEPLOY')) AS actions(action)
ON CONFLICT (id) DO NOTHING;

-- ── 5. Permissions (Viewer) ────────────────────────────────────────────────
INSERT INTO permissions (id, role_id, resource, action)
SELECT
    'perm-viewer-' || r.resource || '-READ',
    'role-seed-viewer',
    r.resource,
    'READ'
FROM (VALUES
    ('CANVAS'), ('PROVISION'), ('COST'), ('OBSERVE'),
    ('PLATFORM'), ('IAM'), ('AUDIT'), ('SETTINGS')
) AS resources(resource)
ON CONFLICT (id) DO NOTHING;

-- ── 6. Admin User ──────────────────────────────────────────────────────────
-- Password: Admin@123 (BCrypt hash)
-- Generated with: bcrypt.hashSync('Admin@123', 10)
INSERT INTO iam_users (id, name, email, password_hash, enabled, email_verified, sso_only, created_at, updated_at)
VALUES (
    'user-seed-admin',
    'Administrador',
    'admin@cloudbuilder.dev',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    TRUE,
    TRUE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- ── 7. Link User to Tenant ─────────────────────────────────────────────────
INSERT INTO tenant_users (id, tenant_id, user_id, role_id, status, active)
VALUES ('tu-seed-admin', 'tenant-seed-001', 'user-seed-admin', 'role-seed-admin', 'ACTIVE', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ── 8. Organization ────────────────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, owner_id, active, created_at, updated_at)
VALUES ('org-seed-001', 'CloudBuilder Demo', 'cloudbuilder-demo', 'user-seed-admin', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ── 9. Default Project ─────────────────────────────────────────────────────
INSERT INTO iam_projects (id, organization_id, name, description, active, created_at, updated_at)
VALUES ('proj-seed-001', 'org-seed-001', 'Projeto Padrão', 'Projeto principal da organização', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ── 10. Default Team ───────────────────────────────────────────────────────
INSERT INTO teams (id, organization_id, name, description, created_at, updated_at)
VALUES ('team-seed-001', 'org-seed-001', 'Equipe Principal', 'Time principal da organização', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EXAMPLE CANVAS: GCP Stack (VPC → Subnet → VM → SQL)
-- ============================================================================

-- ── 11. Canvas ─────────────────────────────────────────────────────────────
INSERT INTO canvases (id, tenant_id, name, description, design_version, created_by, created_at, updated_at)
VALUES (
    'canvas-seed-gcp',
    'tenant-seed-001',
    'GCP Stack - Exemplo',
    'Stack completa no Google Cloud: VPC + Subnet + VM + SQL Database. Canvas de exemplo para novos usuários.',
    5,
    'user-seed-admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- ── 12. Canvas Nodes ───────────────────────────────────────────────────────
INSERT INTO canvas_nodes (id, canvas_id, component_definition_id, properties, position_x, position_y, created_at, updated_at)
VALUES
    -- VPC
    ('node-seed-vpc', 'canvas-seed-gcp', 'google_compute_network',
     '{"name":"main-vpc","auto_create_subnetworks":"false","routing_mode":"GLOBAL"}',
     150.0, 200.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Subnet
    ('node-seed-subnet', 'canvas-seed-gcp', 'google_compute_subnetwork',
     '{"name":"main-subnet","network":"node-seed-vpc","ipCidrRange":"10.0.1.0/24","region":"us-central1"}',
     450.0, 200.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- VM
    ('node-seed-vm', 'canvas-seed-gcp', 'google_compute_instance',
     '{"name":"web-server","machineType":"e2-medium","zone":"us-central1-a","subnetwork":"node-seed-subnet","bootDiskImage":"debian-cloud/debian-11"}',
     750.0, 120.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- SQL
    ('node-seed-sql', 'canvas-seed-gcp', 'google_sql_database_instance',
     '{"name":"app-db","databaseVersion":"POSTGRES_14","region":"us-central1","tier":"db-f1-micro"}',
     750.0, 320.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ── 13. Canvas Edges ───────────────────────────────────────────────────────
INSERT INTO canvas_edges (id, canvas_id, source_node_id, target_node_id, edge_type, properties, created_at, updated_at)
VALUES
    ('edge-seed-vpc-subnet', 'canvas-seed-gcp', 'node-seed-vpc', 'node-seed-subnet', 'contains', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('edge-seed-subnet-vm', 'canvas-seed-gcp', 'node-seed-subnet', 'node-seed-vm', 'deploys', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('edge-seed-subnet-sql', 'canvas-seed-gcp', 'node-seed-subnet', 'node-seed-sql', 'connects', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EXAMPLE CANVAS 2: AWS Stack (VPC → Subnet → EC2)
-- ============================================================================

INSERT INTO canvases (id, tenant_id, name, description, design_version, created_by, created_at, updated_at)
VALUES (
    'canvas-seed-aws',
    'tenant-seed-001',
    'AWS Stack - Exemplo',
    'Stack básica na AWS: VPC + Subnet + EC2. Ideal para testes rápidos.',
    3,
    'user-seed-admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO canvas_nodes (id, canvas_id, component_definition_id, properties, position_x, position_y, created_at, updated_at)
VALUES
    ('node-seed-aws-vpc', 'canvas-seed-aws', 'aws_vpc',
     '{"cidr_block":"10.0.0.0/16","name":"prod-vpc","enable_dns_hostnames":"true","enable_dns_support":"true"}',
     150.0, 200.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('node-seed-aws-subnet', 'canvas-seed-aws', 'aws_subnet',
     '{"cidr_block":"10.0.1.0/24","vpc_id":"node-seed-aws-vpc","availability_zone":"us-east-1a","map_public_ip_on_launch":"true","name":"public-subnet"}',
     450.0, 200.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('node-seed-aws-ec2', 'canvas-seed-aws', 'aws_instance',
     '{"ami":"ami-0c55b159cbfafe1f0","instance_type":"t3.large","subnet_id":"node-seed-aws-subnet","key_name":"my-keypair","name":"web-server"}',
     750.0, 200.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO canvas_edges (id, canvas_id, source_node_id, target_node_id, edge_type, properties, created_at, updated_at)
VALUES
    ('edge-seed-aws-vpc-subnet', 'canvas-seed-aws', 'node-seed-aws-vpc', 'node-seed-aws-subnet', 'contains', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('edge-seed-aws-subnet-ec2', 'canvas-seed-aws', 'node-seed-aws-subnet', 'node-seed-aws-ec2', 'deploys', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FEATURE FLAGS (default tenant)
-- ============================================================================
INSERT INTO feature_flags (id, tenant_id, flag_key, enabled, description, created_at, updated_at)
VALUES
    ('ff-seed-canvas', NULL, 'module.canvas', TRUE, 'Módulo Canvas (design visual)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ff-seed-provision', NULL, 'module.provision', TRUE, 'Módulo Provisioning (deploy)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ff-seed-cost', NULL, 'module.cost', TRUE, 'Módulo FinOps (custos)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ff-seed-observe', NULL, 'module.observe', TRUE, 'Módulo Observabilidade', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ff-seed-platform', NULL, 'module.platform', TRUE, 'Módulo Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ff-seed-aiops', NULL, 'module.aiops', TRUE, 'Módulo AIOps', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ff-seed-docs', NULL, 'module.docs', TRUE, 'Módulo Documentação', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (flag_key, tenant_id) DO NOTHING;

-- ============================================================================
-- Done! Seed data loaded successfully.
-- ============================================================================
-- Login: admin@cloudbuilder.dev / Admin@123
-- Canvases: "GCP Stack - Exemplo" and "AWS Stack - Exemplo"
-- ============================================================================
