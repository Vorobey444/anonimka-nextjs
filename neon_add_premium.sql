-- Добавляем поля для Premium статуса в таблицу users
-- is_premium - статус Premium (true/false)
-- premium_until - дата окончания Premium подписки
-- country - страна пользователя (для цен)

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'KZ';

-- Создаем таблицу для лимитов пользователей
CREATE TABLE IF NOT EXISTS user_limits (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    
    -- Лимиты фото
    photos_sent_today INT DEFAULT 0,
    photos_last_reset DATE DEFAULT CURRENT_DATE,
    
    -- Лимиты анкет
    ads_created_today INT DEFAULT 0,
    ads_last_reset DATE DEFAULT CURRENT_DATE,
    
    -- Лимиты закрепления
    pin_uses_today INT DEFAULT 0,
    pin_last_reset DATE DEFAULT CURRENT_DATE,
    last_pin_time TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Внешний ключ на таблицу users
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON user_limits(user_id);

-- Комментарии
COMMENT ON TABLE user_limits IS 'Лимиты пользователей (фото, анкеты, закрепление)';
COMMENT ON COLUMN users.is_premium IS 'Статус Premium пользователя';
COMMENT ON COLUMN users.premium_until IS 'Дата окончания Premium подписки';
COMMENT ON COLUMN users.country IS 'Страна пользователя для определения цены';
