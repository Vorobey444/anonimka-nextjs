-- ============================================
-- МИГРАЦИЯ: Очистка дублирующихся данных согласий
-- Выполните в Neon Console ПОСЛЕ основной миграции
-- ============================================

BEGIN;

-- 1️⃣ Мигрируем данные из user_agreements в users (если есть)
-- Обновляем users из user_agreements для пользователей, у которых есть согласие
UPDATE users u
SET agreed_to_terms = ua.agreed_to_terms,
    updated_at = NOW()
FROM user_agreements ua
WHERE u.user_token = ua.user_token
  AND ua.agreed_to_terms = true
  AND (u.agreed_to_terms IS NULL OR u.agreed_to_terms = false);

-- 2️⃣ Удаляем таблицу user_agreements (больше не нужна)
DROP TABLE IF EXISTS user_agreements CASCADE;

-- 3️⃣ Удаляем избыточную колонку agreed_at из users (оставляем только agreed_to_terms)
ALTER TABLE users DROP COLUMN IF EXISTS agreed_at CASCADE;

-- 4️⃣ Убедимся что индекс есть в users
CREATE INDEX IF NOT EXISTS idx_users_agreed_to_terms ON users(agreed_to_terms);
CREATE INDEX IF NOT EXISTS idx_users_user_token ON users(user_token) WHERE user_token IS NOT NULL;

-- 5️⃣ Обновляем комментарий
COMMENT ON COLUMN users.agreed_to_terms IS 'Пользователь согласился с условиями использования (единственное поле для согласий)';

COMMIT;

-- ============================================
-- ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================

-- Проверка 1: Таблица user_agreements удалена
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_agreements'
) as user_agreements_exists;
-- Должно вернуть: false

-- Проверка 2: Только agreed_to_terms есть в users (agreed_at удалена)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'agreed_to_terms';
-- Должно вернуть 1 строку

-- Проверка 2.1: agreed_at удалена
SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'agreed_at'
) as agreed_at_exists;
-- Должно вернуть: false

-- Проверка 3: Статистика согласий в users
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE agreed_to_terms = true) as agreed,
    COUNT(*) FILTER (WHERE agreed_to_terms = false OR agreed_to_terms IS NULL) as not_agreed
FROM users;

-- ✅ Если все 3 проверки прошли - очистка успешна!
