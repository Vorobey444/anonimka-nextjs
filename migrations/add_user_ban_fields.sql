-- Добавление полей для бана пользователей
-- Выполните в Neon SQL Editor: https://console.neon.tech/

-- Добавляем колонки для информации о бане
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;

-- Создаём индекс для быстрой проверки забаненных
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = true;

-- Проверка
SELECT id, display_nickname, is_banned, ban_reason, banned_at 
FROM users 
WHERE is_banned = true 
LIMIT 10;
