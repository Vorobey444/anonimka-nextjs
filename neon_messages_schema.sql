-- Миграция для Neon PostgreSQL
-- Таблица для хранения сообщений в приватных чатах

-- Создаём таблицу messages
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Связь с таблицей private_chats
    CONSTRAINT fk_chat FOREIGN KEY (chat_id) REFERENCES private_chats(id) ON DELETE CASCADE
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = false;

-- Комментарии к таблице
COMMENT ON TABLE messages IS 'Сообщения в приватных чатах';
COMMENT ON COLUMN messages.chat_id IS 'ID чата из таблицы private_chats';
COMMENT ON COLUMN messages.sender_id IS 'Telegram ID отправителя';
COMMENT ON COLUMN messages.receiver_id IS 'Telegram ID получателя';
COMMENT ON COLUMN messages.message IS 'Текст сообщения';
COMMENT ON COLUMN messages.read IS 'Прочитано ли сообщение';
COMMENT ON COLUMN messages.created_at IS 'Время отправки сообщения';
