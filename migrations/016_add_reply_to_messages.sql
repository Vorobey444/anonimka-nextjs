-- Migration: Add reply_to_message_id to messages table
-- This allows messages to reference other messages they're replying to

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_message_id INTEGER;

-- Add index for performance when querying replied messages
CREATE INDEX IF NOT EXISTS idx_messages_reply_to 
ON messages(reply_to_message_id) 
WHERE reply_to_message_id IS NOT NULL;

-- Optional: Add foreign key constraint (commented out in case of historical data issues)
-- ALTER TABLE messages 
-- ADD CONSTRAINT fk_messages_reply_to 
-- FOREIGN KEY (reply_to_message_id) 
-- REFERENCES messages(id) 
-- ON DELETE SET NULL;
