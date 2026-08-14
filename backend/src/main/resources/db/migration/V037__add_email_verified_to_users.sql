-- V037: Add email_verified column to iam_users
-- Idempotent: only alters if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'iam_users') THEN
        ALTER TABLE iam_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;
