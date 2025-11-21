-- ============================================
-- МИГРАЦИЯ: Удаление неиспользуемых колонок из users
-- Выполните в Neon Console ПОСЛЕ миграции 025
-- ============================================

BEGIN;

-- 1️⃣ Удаляем колонки, которые не используются в коде
ALTER TABLE users 
DROP COLUMN IF EXISTS username CASCADE,
DROP COLUMN IF EXISTS first_name CASCADE,
DROP COLUMN IF EXISTS last_name CASCADE,
DROP COLUMN IF EXISTS city CASCADE,
DROP COLUMN IF EXISTS agreed_to_rules CASCADE,
DROP COLUMN IF EXISTS agreed_to_privacy CASCADE,
DROP COLUMN IF EXISTS agreements_accepted_at CASCADE;

-- 2️⃣ Обновляем комментарий к таблице
COMMENT ON TABLE users IS 'Пользователи (минимальная схема: только используемые поля)';

COMMIT;

-- ============================================
-- ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================

-- Проверка 1: Удалены все неиспользуемые колонки
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('username', 'first_name', 'last_name', 'city', 'agreed_to_rules', 'agreed_to_privacy', 'agreements_accepted_at')
ORDER BY column_name;
-- Должно вернуть: 0 строк

-- Проверка 2: Остались только используемые колонки
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
-- Должны остаться: id, country, is_premium, premium_until, user_token, nickname_changed_at, agreed_to_terms, is_banned, ban_reason, banned_at, is_admin, created_at, updated_at

-- Проверка 3: Статистика users
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_premium = true) as premium_users,
    COUNT(*) FILTER (WHERE agreed_to_terms = true) as agreed_users,
    COUNT(*) FILTER (WHERE user_token IS NOT NULL) as with_token
FROM users;

-- ✅ Если все 3 проверки прошли - очистка успешна!
