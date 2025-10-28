-- Таблица для хранения сообщений между пользователями
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    ad_id BIGINT NOT NULL,
    sender_tg_id TEXT NOT NULL,
    receiver_tg_id TEXT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    
    -- Связь с таблицей объявлений
    CONSTRAINT fk_ad FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_tg_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_tg_id);
CREATE INDEX IF NOT EXISTS idx_messages_ad ON messages(ad_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Включаем Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут читать только свои сообщения (где они отправитель или получатель)
CREATE POLICY "Users can read their own messages" ON messages
    FOR SELECT
    USING (
        sender_tg_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR receiver_tg_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );

-- Политика: пользователи могут создавать сообщения
CREATE POLICY "Users can create messages" ON messages
    FOR INSERT
    WITH CHECK (true);

-- Комментарии к таблице
COMMENT ON TABLE messages IS 'Сообщения между пользователями по объявлениям';
COMMENT ON COLUMN messages.ad_id IS 'ID объявления, к которому относится сообщение';
COMMENT ON COLUMN messages.sender_tg_id IS 'Telegram ID отправителя';
COMMENT ON COLUMN messages.receiver_tg_id IS 'Telegram ID получателя (автора объявления)';
COMMENT ON COLUMN messages.message_text IS 'Текст сообщения';
COMMENT ON COLUMN messages.is_read IS 'Прочитано ли сообщение';
