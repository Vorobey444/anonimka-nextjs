-- Migration 007: Add display_nickname to users for saving user's chosen nickname
-- Date: 2025-11-06
-- Purpose: Store user's display nickname across ads (currently only in ads table)

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_nickname TEXT;

-- Индекс для быстрого поиска по никнейму (опционально)
CREATE INDEX IF NOT EXISTS idx_users_display_nickname ON users (display_nickname);

COMMIT;
