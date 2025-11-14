-- Таблица для хранения истории чата "Мир чата"
CREATE TABLE IF NOT EXISTS world_chat_messages (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    user_token VARCHAR(255), -- для идентификации веб-пользователей
    message TEXT NOT NULL,
    photo_url TEXT, -- URL фото если есть
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_world_chat_created_at ON world_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_chat_user_id ON world_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_world_chat_user_token ON world_chat_messages(user_token);

-- Таблица для хранения истории приватных чатов
CREATE TABLE IF NOT EXISTS private_chat_messages (
    id SERIAL PRIMARY KEY,
    chat_room_id VARCHAR(255) NOT NULL, -- уникальный ID чата между двумя пользователями
    sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    sender_token VARCHAR(255),
    sender_nickname VARCHAR(100) NOT NULL,
    receiver_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    receiver_token VARCHAR(255),
    message TEXT NOT NULL,
    photo_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_private_chat_room ON private_chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_created_at ON private_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_chat_sender ON private_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_receiver ON private_chat_messages(receiver_id);

COMMENT ON TABLE world_chat_messages IS 'История общего чата для модерации';
COMMENT ON TABLE private_chat_messages IS 'История приватных чатов для модерации';
