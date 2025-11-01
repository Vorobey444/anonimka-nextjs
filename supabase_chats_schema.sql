-- Таблица для хранения приватных чатов между пользователями
CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    chat_id TEXT UNIQUE NOT NULL,
    user1_tg_id BIGINT NOT NULL,
    user2_tg_id BIGINT NOT NULL,
    ad_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    blocked_by BIGINT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_chats_chat_id ON chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_user1 ON chats(user1_tg_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2 ON chats(user2_tg_id);
CREATE INDEX IF NOT EXISTS idx_chats_ad_id ON chats(ad_id);
CREATE INDEX IF NOT EXISTS idx_chats_active ON chats(is_active) WHERE is_active = true;

-- Комментарии к полям
COMMENT ON TABLE chats IS 'Приватные чаты между пользователями по объявлениям';
COMMENT ON COLUMN chats.chat_id IS 'Уникальный идентификатор чата: {min_user_id}_{max_user_id}_{ad_id}';
COMMENT ON COLUMN chats.user1_tg_id IS 'Telegram ID первого пользователя (меньший ID)';
COMMENT ON COLUMN chats.user2_tg_id IS 'Telegram ID второго пользователя (больший ID)';
COMMENT ON COLUMN chats.ad_id IS 'ID объявления, по которому создан чат';
COMMENT ON COLUMN chats.is_active IS 'Активен ли чат';
COMMENT ON COLUMN chats.blocked_by IS 'ID пользователя, который заблокировал чат (NULL если не заблокирован)';

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_chats_updated_at();

-- RLS политики
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои чаты
CREATE POLICY "Users can view their own chats"
    ON chats FOR SELECT
    USING (
        auth.uid()::text IN (user1_tg_id::text, user2_tg_id::text)
        OR auth.role() = 'service_role'
    );

-- Service role может создавать чаты (через API)
CREATE POLICY "Service role can insert chats"
    ON chats FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Пользователи могут обновлять свои чаты (блокировка)
CREATE POLICY "Users can update their own chats"
    ON chats FOR UPDATE
    USING (
        auth.uid()::text IN (user1_tg_id::text, user2_tg_id::text)
        OR auth.role() = 'service_role'
    );
