-- Fix: module.iam should be enabled by default (was incorrectly set to false in V15)
UPDATE feature_flags
SET enabled = true,
    description = 'Habilitar módulo IAM (identidade, papéis, permissões)',
    updated_at = CURRENT_TIMESTAMP
WHERE flag_key = 'module.iam'
  AND tenant_id IS NULL
  AND enabled = false;
