-- Migration: Add FCM token support to users table
-- Date: 2025-12-02
-- Description: Add fcm_token and fcm_updated_at columns for Push notifications

-- Add FCM token columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS fcm_updated_at TIMESTAMP;

-- Create index for faster FCM token lookups
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token) WHERE fcm_token IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
COMMENT ON COLUMN users.fcm_updated_at IS 'Timestamp when FCM token was last updated';
