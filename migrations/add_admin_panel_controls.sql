-- Migration: Add admin panel control columns
-- Date: 2025-12-05
-- Purpose: Add ban and block controls for admin panel moderation

-- Add ban control columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS banned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS banned_by_token VARCHAR(255);

-- Add block control columns to ads table
ALTER TABLE ads
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS blocked_by_admin VARCHAR(255),
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_banned_until ON users(banned_until) WHERE banned_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_banned_by ON users(banned_by) WHERE banned_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ads_is_blocked ON ads(is_blocked) WHERE is_blocked = TRUE;
CREATE INDEX IF NOT EXISTS idx_ads_blocked_until ON ads(blocked_until) WHERE blocked_until IS NOT NULL;

-- Add comments
COMMENT ON COLUMN users.banned_until IS 'Дата окончания бана пользователя (NULL = перманентный бан)';
COMMENT ON COLUMN users.banned_by IS 'ID администратора, который забанил пользователя';
COMMENT ON COLUMN users.banned_by_token IS 'user_token администратора, который забанил пользователя';
COMMENT ON COLUMN ads.is_blocked IS 'Заблокировано ли объявление администратором';
COMMENT ON COLUMN ads.blocked_reason IS 'Причина блокировки объявления';
COMMENT ON COLUMN ads.blocked_until IS 'Дата окончания блокировки (NULL = перманентная блокировка)';
COMMENT ON COLUMN ads.blocked_by_admin IS 'user_token администратора, который заблокировал объявление';
COMMENT ON COLUMN ads.blocked_at IS 'Дата и время блокировки объявления';

-- Verification query
DO $$
BEGIN
  RAISE NOTICE 'Migration completed!';
  RAISE NOTICE 'users.banned_until exists: %', EXISTS(
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'banned_until'
  );
  RAISE NOTICE 'ads.is_blocked exists: %', EXISTS(
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ads' AND column_name = 'is_blocked'
  );
END $$;
