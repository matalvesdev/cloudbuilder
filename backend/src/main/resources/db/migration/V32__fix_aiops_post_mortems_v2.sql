-- V32: Add missing columns to aiops_post_mortems

ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36);
