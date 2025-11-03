-- Миграция для Neon PostgreSQL
-- Добавление Premium функционала

-- Создаём таблицу users для хранения данных пользователей
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    country TEXT DEFAULT 'KZ',
    city TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Создаём таблицу для лимитов пользователей
CREATE TABLE IF NOT EXISTS user_limits (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    photos_sent_today INTEGER DEFAULT 0,
    photos_last_reset DATE DEFAULT CURRENT_DATE,
    ads_created_today INTEGER DEFAULT 0,
    ads_last_reset DATE DEFAULT CURRENT_DATE,
    pin_uses_today INTEGER DEFAULT 0,
    pin_last_reset DATE DEFAULT CURRENT_DATE,
    last_pin_time TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Добавляем поле photo_url в messages для фото через Telegram CDN
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Добавляем поле telegram_file_id для хранения file_id от Telegram
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS telegram_file_id TEXT;

-- Комментарии к полям
COMMENT ON COLUMN messages.photo_url IS 'URL фото из Telegram CDN';
COMMENT ON COLUMN messages.telegram_file_id IS 'File ID фото в Telegram для повторного использования';
COMMENT ON TABLE users IS 'Данные пользователей с Premium статусом';
COMMENT ON TABLE user_limits IS 'Дневные лимиты для пользователей';

-- Создаём индексы
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON user_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_photo ON messages(photo_url) WHERE photo_url IS NOT NULL;

-- Функция для автоматического сброса лимитов
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS void AS $$
BEGIN
    -- Сброс лимита фото
    UPDATE user_limits
    SET photos_sent_today = 0,
        photos_last_reset = CURRENT_DATE
    WHERE photos_last_reset < CURRENT_DATE;
    
    -- Сброс лимита объявлений
    UPDATE user_limits
    SET ads_created_today = 0,
        ads_last_reset = CURRENT_DATE
    WHERE ads_last_reset < CURRENT_DATE;
    
    -- Сброс лимита закрепления
    UPDATE user_limits
    SET pin_uses_today = 0,
        pin_last_reset = CURRENT_DATE
    WHERE pin_last_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Функция для проверки истечения Premium подписки
CREATE OR REPLACE FUNCTION check_premium_expiry()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET is_premium = FALSE
    WHERE is_premium = TRUE 
      AND premium_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Проверяем результат
SELECT 'Users table created' as status;
SELECT 'User limits table created' as status;
SELECT 'Messages photo fields added' as status;
