-- Rollback 005: Restore legacy columns (EMERGENCY ONLY)
-- WARNING: Cannot restore dropped columns with data - only structure
-- This rollback recreates empty columns for compatibility

BEGIN;

-- Restore ads.tg_id (empty)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS tg_id BIGINT;

-- Restore messages.sender_id (empty)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id BIGINT;

-- Restore private_chats legacy columns (empty)
ALTER TABLE private_chats ADD COLUMN IF NOT EXISTS user1 VARCHAR(255);
ALTER TABLE private_chats ADD COLUMN IF NOT EXISTS user2 VARCHAR(255);
ALTER TABLE private_chats ADD COLUMN IF NOT EXISTS user_token VARCHAR(255);

-- Restore messages.user_token (empty)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_token VARCHAR(255);

-- Restore referrals.user_token (empty)
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS user_token VARCHAR(255);

-- Restore user_blocks.user_token (empty)
ALTER TABLE user_blocks ADD COLUMN IF NOT EXISTS user_token VARCHAR(255);

RAISE NOTICE '⚠️  Rollback complete: columns restored but DATA IS LOST';
RAISE NOTICE '⚠️  To restore data, you must restore from database backup';

COMMIT;
