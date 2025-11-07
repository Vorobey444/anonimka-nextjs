-- Миграция 012: Создание таблицы web_user_limits для учета лимитов веб-пользователей
-- Проблема: user_limits работает только с user_id (tg_id), нужна таблица для user_token

-- Создаем таблицу для лимитов веб-пользователей (по user_token)
CREATE TABLE IF NOT EXISTS web_user_limits (
    id SERIAL PRIMARY KEY,
    user_token TEXT NOT NULL UNIQUE,
    photos_sent_today INTEGER DEFAULT 0,
    photos_last_reset DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_web_user_limits_token ON web_user_limits(user_token);
CREATE INDEX IF NOT EXISTS idx_web_user_limits_reset ON web_user_limits(photos_last_reset);

-- Комментарии
COMMENT ON TABLE web_user_limits IS 'Лимиты для веб-пользователей (без Telegram)';
COMMENT ON COLUMN web_user_limits.user_token IS 'User token пользователя';
COMMENT ON COLUMN web_user_limits.photos_sent_today IS 'Количество отправленных фото сегодня';
COMMENT ON COLUMN web_user_limits.photos_last_reset IS 'Дата последнего сброса счетчика';

-- Проверка результата
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'web_user_limits'
    ) THEN
        RAISE NOTICE '✅ Миграция 012 успешно применена: создана таблица web_user_limits';
    ELSE
        RAISE WARNING '⚠️ Миграция 012: таблица web_user_limits не создана';
    END IF;
END $$;
