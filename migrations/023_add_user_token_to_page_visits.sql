-- Migration 023: Add user_token to page_visits
-- Date: 2025-11-21
-- Purpose: Track web users (without tg_id) in analytics

-- Add user_token column to page_visits
ALTER TABLE page_visits
ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_page_visits_user_token ON page_visits(user_token);

-- Add comment
COMMENT ON COLUMN page_visits.user_token IS 'User token for web users without Telegram ID';

-- Verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'page_visits' 
AND column_name = 'user_token';
