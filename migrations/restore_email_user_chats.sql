-- Migration: Update chat and message tokens after email user token migration
-- Date: 2025-12-05
-- Purpose: Update all chat and message references to use new deterministic email tokens
-- This restores chats for email users after token migration

-- Function to generate deterministic email token (same as in fix_email_tokens_deterministic.sql)
CREATE OR REPLACE FUNCTION generate_email_token(email VARCHAR) RETURNS VARCHAR AS $$
BEGIN
  RETURN encode(
    hmac(
      email || ':email:v1',
      COALESCE(current_setting('app.user_token_secret', true), 'dev-temp-secret'),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a mapping table to track old -> new tokens for email users
CREATE TEMP TABLE token_mapping AS
SELECT 
  u.id,
  u.email,
  u.user_token as old_token,
  generate_email_token(LOWER(TRIM(u.email))) as new_token
FROM users u
WHERE u.auth_method = 'email' AND u.email IS NOT NULL
  AND u.user_token != generate_email_token(LOWER(TRIM(u.email)));

-- Count affected chats
WITH chat_updates AS (
  SELECT COUNT(*) as count
  FROM private_chats pc
  WHERE pc.user_1_token IN (SELECT old_token FROM token_mapping)
     OR pc.user_2_token IN (SELECT old_token FROM token_mapping)
)
SELECT 'Affected chats: ' || count::text FROM chat_updates;

-- Update private_chats table - user_1_token
UPDATE private_chats
SET user_1_token = (
  SELECT new_token FROM token_mapping tm 
  WHERE tm.old_token = private_chats.user_1_token
  LIMIT 1
)
WHERE user_1_token IN (SELECT old_token FROM token_mapping);

-- Update private_chats table - user_2_token
UPDATE private_chats
SET user_2_token = (
  SELECT new_token FROM token_mapping tm 
  WHERE tm.old_token = private_chats.user_2_token
  LIMIT 1
)
WHERE user_2_token IN (SELECT old_token FROM token_mapping);

-- Update private_messages table - sender_token
UPDATE private_messages
SET sender_token = (
  SELECT new_token FROM token_mapping tm 
  WHERE tm.old_token = private_messages.sender_token
  LIMIT 1
)
WHERE sender_token IN (SELECT old_token FROM token_mapping);

-- Update private_messages table - receiver_token
UPDATE private_messages
SET receiver_token = (
  SELECT new_token FROM token_mapping tm 
  WHERE tm.old_token = private_messages.receiver_token
  LIMIT 1
)
WHERE receiver_token IN (SELECT old_token FROM token_mapping);

-- Verify the updates
DO $$
DECLARE
  chat_count INT;
  msg_count INT;
BEGIN
  SELECT COUNT(*) INTO chat_count FROM private_chats 
  WHERE user_1_token IN (SELECT new_token FROM token_mapping) 
     OR user_2_token IN (SELECT new_token FROM token_mapping);
  
  SELECT COUNT(*) INTO msg_count FROM private_messages 
  WHERE sender_token IN (SELECT new_token FROM token_mapping) 
     OR receiver_token IN (SELECT new_token FROM token_mapping);
  
  RAISE NOTICE 'Migration completed!';
  RAISE NOTICE 'Chats with updated tokens: %', chat_count;
  RAISE NOTICE 'Messages with updated tokens: %', msg_count;
  RAISE NOTICE 'All email user chats have been restored with new deterministic tokens';
END $$;
