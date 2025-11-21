-- ============================================
-- СРОЧНАЯ МИГРАЦИЯ: Analytics + Users tokens
-- Выполните в Neon Console ПРЯМО СЕЙЧАС
-- ============================================

BEGIN;

-- 1️⃣ Добавление user_token в page_visits (миграция 023)
ALTER TABLE page_visits
ADD COLUMN IF NOT EXISTS user_token VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_page_visits_user_token ON page_visits(user_token);

COMMENT ON COLUMN page_visits.user_token IS 'User token for web users without Telegram ID';

-- 2️⃣ Синхронизация user_token в users (миграция 024)
-- Заполняем users.user_token из самого свежего объявления пользователя
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

CREATE INDEX IF NOT EXISTS idx_users_user_token ON users(user_token) WHERE user_token IS NOT NULL;

COMMENT ON COLUMN users.user_token IS 'Токен для синхронизации Premium между Telegram и Web версиями';

COMMIT;

-- ============================================
-- ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================

-- Проверка 1: Колонка user_token добавлена в page_visits
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'page_visits' 
AND column_name = 'user_token';

-- Проверка 2: Статистика заполнения user_token в users
SELECT 
    COUNT(*) FILTER (WHERE user_token IS NOT NULL) as filled,
    COUNT(*) FILTER (WHERE user_token IS NULL) as empty,
    COUNT(*) as total
FROM users;

-- Проверка 3: Ваш аккаунт (должен быть user_token)
SELECT id, user_token, is_premium, premium_until 
FROM users 
WHERE id = 884253640;

-- ✅ Если все 3 проверки прошли - миграция успешна!
