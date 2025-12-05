-- Migration: Fix email user tokens to use deterministic HMAC
-- Date: 2025-12-05
-- Purpose: Convert random email tokens to deterministic HMAC-based tokens
-- This ensures consistency with the new email auth system

-- Function to generate deterministic email token (same as generateEmailUserToken in Node.js)
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

-- Update email users with deterministic tokens
-- This query will:
-- 1. Find all email users (auth_method = 'email')
-- 2. Generate new deterministic token based on their email
-- 3. Update their user_token
UPDATE users
SET user_token = generate_email_token(LOWER(TRIM(email)))
WHERE auth_method = 'email' AND email IS NOT NULL;

-- Verify the update
SELECT COUNT(*) as total_email_users, 
       COUNT(DISTINCT user_token) as unique_tokens
FROM users 
WHERE auth_method = 'email';

-- Show the updated tokens (first 5)
SELECT id, email, user_token, auth_method 
FROM users 
WHERE auth_method = 'email'
LIMIT 5;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Email user tokens migration completed!';
  RAISE NOTICE 'All email users now use deterministic HMAC-SHA256 tokens';
  RAISE NOTICE 'Token format: HMAC-SHA256(lowercase_trimmed_email + ":email:v1")';
END $$;
