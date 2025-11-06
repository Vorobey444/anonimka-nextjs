-- Migration 005: Final cleanup - remove all legacy columns and backup tables
-- Date: 2025-11-06
-- Purpose: Beta testing phase - remove all unnecessary legacy data for clean production start

BEGIN;

-- Drop backup tables (no longer needed, we have git history)
DROP TABLE IF EXISTS messages_backup_20250105;
DROP TABLE IF EXISTS private_chats_backup_20250105;
DROP TABLE IF EXISTS user_blocks_backup_20250105;
DROP TABLE IF EXISTS users_backup_20251106;

-- KEEP ads.tg_id - it's used as lookup key for users/user_limits tables
-- APIs use: user_token -> ads.tg_id -> users.id / user_limits.user_id
-- This is the anonymous bridge between tokens and internal IDs

-- Remove legacy sender_id and receiver_id from messages (we use sender_token now)
-- Note: receiver_id is still used as TEXT for token comparison, so we keep it
-- but we can remove sender_id since sender_token is mandatory
ALTER TABLE messages DROP COLUMN IF EXISTS sender_id;

-- Remove legacy user1/user2 from private_chats (we use user_token_1/2 now)
ALTER TABLE private_chats DROP COLUMN IF EXISTS user1;
ALTER TABLE private_chats DROP COLUMN IF EXISTS user2;

-- Remove legacy user_token (single) - we use user_token_1/2 now
ALTER TABLE private_chats DROP COLUMN IF EXISTS user_token;

-- Remove legacy referrer_id/referred_id from referrals (keeping for now - used by bot)
-- Skip: referrals still needs numeric IDs for bot integration

-- Remove legacy blocker_id/blocked_id from user_blocks (keeping for now - used by bot)
-- Skip: user_blocks still needs numeric IDs for bot integration

-- Remove user_token from messages (we use sender_token now)
ALTER TABLE messages DROP COLUMN IF EXISTS user_token;

-- Remove user_token from referrals (not used)
ALTER TABLE referrals DROP COLUMN IF EXISTS user_token;

-- Remove user_token from user_blocks (not used)
ALTER TABLE user_blocks DROP COLUMN IF EXISTS user_token;

-- Verify critical columns remain
DO $$
DECLARE
  ads_token_exists BOOLEAN;
  messages_sender_token_exists BOOLEAN;
  chats_tokens_exist BOOLEAN;
BEGIN
  -- Check ads.user_token
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ads' AND column_name = 'user_token'
  ) INTO ads_token_exists;
  
  -- Check messages.sender_token
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'sender_token'
  ) INTO messages_sender_token_exists;
  
  -- Check private_chats.user_token_1 and user_token_2
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'private_chats' AND column_name = 'user_token_1'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'private_chats' AND column_name = 'user_token_2'
  ) INTO chats_tokens_exist;
  
  IF NOT ads_token_exists THEN
    RAISE EXCEPTION 'CRITICAL: ads.user_token column missing!';
  END IF;
  
  IF NOT messages_sender_token_exists THEN
    RAISE EXCEPTION 'CRITICAL: messages.sender_token column missing!';
  END IF;
  
  IF NOT chats_tokens_exist THEN
    RAISE EXCEPTION 'CRITICAL: private_chats token columns missing!';
  END IF;
  
  RAISE NOTICE '✅ Cleanup successful. All critical token columns verified.';
  RAISE NOTICE '✅ Removed: backup tables, messages.sender_id/user_token, private_chats.user1/user2/user_token';
  RAISE NOTICE '✅ Kept: ads.tg_id (lookup bridge), referrals/user_blocks numeric IDs (for bot integration)';
END $$;

COMMIT;
