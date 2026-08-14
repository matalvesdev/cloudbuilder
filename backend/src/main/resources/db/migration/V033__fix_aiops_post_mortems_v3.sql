-- V33: Add remaining missing columns to aiops_post_mortems

ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS severity VARCHAR(20);
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS environment_id VARCHAR(36);
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);
