-- Миграция: Добавление email авторизации для Android приложения
-- Дата: 2025-11-27

-- Добавляем новые колонки в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(50) DEFAULT 'telegram',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_from VARCHAR(20) DEFAULT 'webapp';

-- Создаем индекс для быстрого поиска по email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_method ON users(auth_method);

-- Комментарии к колонкам
COMMENT ON COLUMN users.email IS 'Email пользователя для авторизации (Android app)';
COMMENT ON COLUMN users.email_verified IS 'Подтверждён ли email адрес';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля (bcrypt)';
COMMENT ON COLUMN users.auth_method IS 'Метод авторизации: telegram, email, google';
COMMENT ON COLUMN users.last_login_at IS 'Дата последнего входа';
COMMENT ON COLUMN users.created_from IS 'Откуда зарегистрирован: webapp, android, ios';

-- Обновляем существующих пользователей
UPDATE users 
SET auth_method = 'telegram',
    created_from = 'webapp'
WHERE auth_method IS NULL;

-- Проверка
SELECT 
    COUNT(*) as total_users,
    COUNT(email) as users_with_email,
    COUNT(CASE WHEN auth_method = 'telegram' THEN 1 END) as telegram_users,
    COUNT(CASE WHEN auth_method = 'email' THEN 1 END) as email_users
FROM users;
