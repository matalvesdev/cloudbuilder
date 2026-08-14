-- V34: Add remaining missing columns to aiops_post_mortems

ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS root_cause TEXT;
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS impact TEXT;
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS timeline TEXT;
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS action_items TEXT;
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS lessons_learned TEXT;
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT';
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS incident_id VARCHAR(36);
ALTER TABLE aiops_post_mortems ADD COLUMN IF NOT EXISTS environment_id VARCHAR(36);
