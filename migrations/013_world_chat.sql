-- Migration 013: World Chat Messages
-- Создание таблицы для глобального чата с тремя типами сообщений

CREATE TABLE IF NOT EXISTS world_chat_messages (
    id SERIAL PRIMARY KEY,
    user_token TEXT NOT NULL,
    nickname VARCHAR(30) NOT NULL,
    message TEXT NOT NULL CHECK (char_length(message) <= 50),
    type VARCHAR(10) NOT NULL CHECK (type IN ('world', 'city', 'private')),
    target_user_token TEXT,
    target_nickname VARCHAR(30),
    location_city VARCHAR(100),
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_world_chat_created_at ON world_chat_messages(created_at DESC);
CREATE INDEX idx_world_chat_type ON world_chat_messages(type);
CREATE INDEX idx_world_chat_user_token ON world_chat_messages(user_token);
CREATE INDEX idx_world_chat_target_token ON world_chat_messages(target_user_token) WHERE target_user_token IS NOT NULL;
CREATE INDEX idx_world_chat_location ON world_chat_messages(location_city) WHERE location_city IS NOT NULL;

-- Комментарии
COMMENT ON TABLE world_chat_messages IS 'Глобальный чат с тремя вкладками: Мир, Город, ЛС';
COMMENT ON COLUMN world_chat_messages.type IS 'world = @, city = &, private = /';
COMMENT ON COLUMN world_chat_messages.target_user_token IS 'Для личных сообщений (type=private)';
COMMENT ON COLUMN world_chat_messages.target_nickname IS 'Никнейм получателя для личных сообщений';
COMMENT ON COLUMN world_chat_messages.location_city IS 'Для городских сообщений (type=city)';
