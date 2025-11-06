-- Migration 004: Clear PII from users table
-- Date: 2025-11-06
-- Purpose: Remove real Telegram usernames and names, keep only anonymous tokens

BEGIN;

-- Backup current state
CREATE TABLE IF NOT EXISTS users_backup_20251106 AS 
SELECT * FROM users;

-- Clear PII fields
UPDATE users 
SET 
  username = NULL,
  first_name = NULL,
  last_name = NULL
WHERE username IS NOT NULL 
   OR first_name IS NOT NULL 
   OR last_name IS NOT NULL;

-- Verify
DO $$
DECLARE
  pii_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pii_count
  FROM users
  WHERE username IS NOT NULL 
     OR first_name IS NOT NULL 
     OR last_name IS NOT NULL;
  
  RAISE NOTICE 'Users with PII remaining: %', pii_count;
  
  IF pii_count > 0 THEN
    RAISE EXCEPTION 'PII cleanup failed: % users still have personal data', pii_count;
  END IF;
  
  RAISE NOTICE 'PII cleanup successful. All username/first_name/last_name cleared.';
END $$;

COMMIT;
