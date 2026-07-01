-- ═══════════════════════════════════════════════════════════════════════════
-- CloudBuilder — Feature Flags (ADR-032)
-- ═══════════════════════════════════════════════════════════════════════════
-- Permite habilitar/desabilitar módulos e features por tenant ou globalmente
-- sem necessidade de redeploy. Integrado com RBAC (AND lógico).
--
-- Resolução: tenant-specific > global > default (false)
-- Cache: Caffeine 30s TTL no backend
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feature_flags (
    id              VARCHAR(36)     PRIMARY KEY,
    flag_key        VARCHAR(100)    NOT NULL,
    enabled         BOOLEAN         NOT NULL DEFAULT false,
    tenant_id       VARCHAR(36),
    config_json     TEXT,
    description     VARCHAR(500),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique per key+tenant (null tenant = global flag)
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_key_tenant
    ON feature_flags (flag_key, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'));

-- Index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant
    ON feature_flags (tenant_id);

-- Index for flag key lookup
CREATE INDEX IF NOT EXISTS idx_feature_flags_key
    ON feature_flags (flag_key);

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed: Beta Profile — Global Flags (tenant_id = NULL)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO feature_flags (id, flag_key, enabled, tenant_id, config_json, description) VALUES
    -- Core modules (all enabled for beta)
    ('a1000001-0000-4000-8000-000000000001', 'module.cost',        true,  NULL, NULL,         'Habilitar módulo de Custos'),
    ('a1000001-0000-4000-8000-000000000002', 'module.platform',    true,  NULL, NULL,         'Habilitar módulo de Plataforma'),
    ('a1000001-0000-4000-8000-000000000003', 'module.aiops',       true,  NULL, NULL,         'Habilitar módulo AIOps'),
    ('a1000001-0000-4000-8000-000000000004', 'module.audit',       true,  NULL, NULL,         'Habilitar módulo de Auditoria'),
    ('a1000001-0000-4000-8000-000000000005', 'module.iam',         false, NULL, NULL,         'Habilitar módulo IAM (stub)'),
    -- Feature toggles (disabled by default)
    ('a1000001-0000-4000-8000-000000000006', 'feature.what-if-cost',       false, NULL, NULL, 'Cenários what-if de custos'),
    ('a1000001-0000-4000-8000-000000000007', 'feature.preview-workflow',   false, NULL, NULL, 'Preview de deploy workflow'),
    -- Config flags
    ('a1000001-0000-4000-8000-000000000008', 'config.max-users',   true,  NULL, '{"value":10}', 'Limite máximo de usuários por tenant')
ON CONFLICT (flag_key, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000')) DO NOTHING;
