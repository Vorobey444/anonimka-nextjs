-- Migration 008: Add user_token to users table for cross-device sync
-- Date: 2025-11-06
-- Purpose: Store single user_token per user for identification across devices

BEGIN;

-- Добавляем колонку user_token в users
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_token TEXT UNIQUE;

-- Создаём индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_users_user_token ON users (user_token);

-- Мигрируем существующие токены из ads в users (берём первый токен каждого пользователя)
UPDATE users u
SET user_token = (
    SELECT a.user_token 
    FROM ads a 
    WHERE a.tg_id = u.id 
    ORDER BY a.created_at ASC 
    LIMIT 1
)
WHERE u.user_token IS NULL
  AND EXISTS (SELECT 1 FROM ads a WHERE a.tg_id = u.id);

COMMIT;
