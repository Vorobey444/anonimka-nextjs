-- Migration: Restore lost email user chats by finding old tokens in messages
-- Date: 2025-12-05
-- Purpose: Find old email user tokens in messages table and update to new deterministic tokens

-- Step 1: Find all unique tokens from messages that don't exist in users (lost tokens)
CREATE TEMP TABLE lost_tokens AS
SELECT DISTINCT sender_token as token
FROM messages
WHERE sender_token NOT IN (SELECT user_token FROM users);

-- Step 2: Try to match lost tokens with email users by display_nickname
-- This creates a mapping of old_token -> new_token based on nickname matching
CREATE TEMP TABLE token_recovery_map AS
SELECT DISTINCT
  m.sender_token as old_token,
  u.user_token as new_token,
  u.email,
  m.display_nickname
FROM messages m
JOIN users u ON LOWER(m.display_nickname) = LOWER(u.display_nickname)
WHERE m.sender_token IN (SELECT token FROM lost_tokens)
  AND u.auth_method = 'email';

-- Show what we found
SELECT 'Found lost tokens: ' || COUNT(*)::text FROM lost_tokens;
SELECT 'Recovered mappings: ' || COUNT(*)::text FROM token_recovery_map;

-- Step 3: Update private_chats with recovered tokens
UPDATE private_chats
SET user_token_1 = trm.new_token
FROM token_recovery_map trm
WHERE private_chats.user_token_1 = trm.old_token;

UPDATE private_chats
SET user_token_2 = trm.new_token
FROM token_recovery_map trm
WHERE private_chats.user_token_2 = trm.old_token;

-- Step 4: Update messages with recovered tokens
UPDATE messages
SET sender_token = trm.new_token
FROM token_recovery_map trm
WHERE messages.sender_token = trm.old_token;

-- Verify results
DO $$
DECLARE
  recovered_chats INT;
  recovered_messages INT;
  still_lost_chats INT;
BEGIN
  -- Count recovered chats
  SELECT COUNT(*) INTO recovered_chats
  FROM private_chats pc
  JOIN users u1 ON pc.user_token_1 = u1.user_token
  JOIN users u2 ON pc.user_token_2 = u2.user_token
  WHERE u1.auth_method = 'email' OR u2.auth_method = 'email';
  
  -- Count recovered messages
  SELECT COUNT(*) INTO recovered_messages
  FROM messages m
  JOIN users u ON m.sender_token = u.user_token
  WHERE u.auth_method = 'email';
  
  -- Count still lost chats
  SELECT COUNT(*) INTO still_lost_chats
  FROM private_chats pc
  LEFT JOIN users u1 ON pc.user_token_1 = u1.user_token
  LEFT JOIN users u2 ON pc.user_token_2 = u2.user_token
  WHERE u1.id IS NULL OR u2.id IS NULL;
  
  RAISE NOTICE '=== Migration Results ===';
  RAISE NOTICE 'Recovered chats with email users: %', recovered_chats;
  RAISE NOTICE 'Recovered messages from email users: %', recovered_messages;
  RAISE NOTICE 'Still lost chats (tokens not found): %', still_lost_chats;
  
  IF still_lost_chats > 0 THEN
    RAISE NOTICE 'Some chats could not be recovered - tokens not matched by nickname';
  ELSE
    RAISE NOTICE 'All chats successfully recovered!';
  END IF;
END $$;

-- Show sample of recovered chats
SELECT 
  pc.id,
  u1.email as user1_email,
  u2.email as user2_email,
  pc.accepted,
  pc.created_at,
  (SELECT COUNT(*) FROM messages WHERE chat_id = pc.id) as message_count
FROM private_chats pc
JOIN users u1 ON pc.user_token_1 = u1.user_token
JOIN users u2 ON pc.user_token_2 = u2.user_token
WHERE u1.auth_method = 'email' OR u2.auth_method = 'email'
ORDER BY pc.created_at DESC
LIMIT 5;
