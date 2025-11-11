-- Migration 012: Add nickname change tracking for PRO users
-- Date: 2025-11-11
-- Purpose: Track last nickname change time to enforce limits (FREE: never, PRO: once per 24h)

BEGIN;

-- Add column to track when nickname was last changed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname_changed_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN users.nickname_changed_at IS 'Timestamp of last nickname change (для PRO: ограничение раз в 24 часа)';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_nickname_changed_at ON users(nickname_changed_at);

COMMIT;
