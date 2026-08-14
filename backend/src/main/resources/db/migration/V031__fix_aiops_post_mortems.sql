-- V31: Add missing columns to aiops_post_mortems

ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS generated_by VARCHAR(36);
