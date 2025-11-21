-- Migration 024: Синхронизация user_token между ads и users
-- Date: 2025-11-21
-- Purpose: Заполнить users.user_token из ads для синхронизации Premium между таблицами

-- Обновляем users.user_token из самого свежего объявления пользователя
UPDATE users u
SET user_token = (
    SELECT a.user_token 
    FROM ads a 
    WHERE a.tg_id = u.id 
    ORDER BY a.created_at DESC 
    LIMIT 1
)
WHERE u.user_token IS NULL
  AND EXISTS (SELECT 1 FROM ads WHERE ads.tg_id = u.id);

-- Создаём индекс для ускорения синхронизации Premium
CREATE INDEX IF NOT EXISTS idx_users_user_token ON users(user_token) WHERE user_token IS NOT NULL;

-- Комментарий
COMMENT ON COLUMN users.user_token IS 'Токен для синхронизации Premium между Telegram и Web версиями';

-- Проверка результата
SELECT 
    COUNT(*) FILTER (WHERE user_token IS NOT NULL) as filled,
    COUNT(*) FILTER (WHERE user_token IS NULL) as empty,
    COUNT(*) as total
FROM users;
