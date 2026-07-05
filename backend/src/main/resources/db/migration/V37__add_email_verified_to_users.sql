-- V30: Add email_verified column to iam_users
ALTER TABLE iam_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
