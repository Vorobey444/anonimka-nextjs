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

-- 3️⃣ Проверка наличия nickname_changed_at для лимита смены никнейма
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname_changed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_nickname_changed_at ON users(nickname_changed_at);

COMMENT ON COLUMN users.nickname_changed_at IS 'Timestamp of last nickname change (FREE: раз, PRO: раз в 24 часа)';

-- 4️⃣ Убедимся что agreed_to_terms и agreed_at есть в users (единственное место хранения)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agreed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_agreed_to_terms ON users(agreed_to_terms);

COMMENT ON COLUMN users.agreed_to_terms IS 'Пользователь согласился с условиями использования (единственное место хранения)';
COMMENT ON COLUMN users.agreed_at IS 'Дата и время согласия с условиями';

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
SELECT id, user_token, is_premium, premium_until, nickname_changed_at
FROM users 
WHERE id = 884253640;

-- Проверка 4: Колонка nickname_changed_at добавлена
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'nickname_changed_at';

-- Проверка 5: Колонки agreed_to_terms и agreed_at есть в users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('agreed_to_terms', 'agreed_at')
ORDER BY column_name;

-- ✅ Если все 5 проверок прошли - миграция успешна!
