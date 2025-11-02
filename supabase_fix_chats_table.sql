-- ВАЖНО: Эта миграция создает правильную таблицу private_chats
-- с полем accepted для системы запросов на чаты

-- Удаляем старую таблицу chats если она есть (осторожно! данные будут потеряны)
-- DROP TABLE IF EXISTS chats CASCADE;

-- Создаем таблицу private_chats с правильной структурой
CREATE TABLE IF NOT EXISTS private_chats (
    id BIGSERIAL PRIMARY KEY,
    ad_id BIGINT NOT NULL,
    user1 BIGINT NOT NULL, -- Отправитель запроса
    user2 BIGINT NOT NULL, -- Получатель запроса (автор объявления)
    accepted BOOLEAN DEFAULT false, -- Принят ли запрос
    initial_message TEXT, -- Первое сообщение в запросе
    blocked_by BIGINT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_private_chats_user1 ON private_chats(user1);
CREATE INDEX IF NOT EXISTS idx_private_chats_user2 ON private_chats(user2);
CREATE INDEX IF NOT EXISTS idx_private_chats_ad_id ON private_chats(ad_id);
CREATE INDEX IF NOT EXISTS idx_private_chats_accepted ON private_chats(accepted) WHERE accepted = false;
CREATE INDEX IF NOT EXISTS idx_private_chats_users_ad ON private_chats(user1, user2, ad_id);

-- Комментарии к полям
COMMENT ON TABLE private_chats IS 'Приватные чаты и запросы на чаты между пользователями';
COMMENT ON COLUMN private_chats.user1 IS 'Telegram ID отправителя запроса';
COMMENT ON COLUMN private_chats.user2 IS 'Telegram ID получателя (автор объявления)';
COMMENT ON COLUMN private_chats.ad_id IS 'ID объявления, по которому создан чат';
COMMENT ON COLUMN private_chats.accepted IS 'Принят ли запрос на чат (false = в ожидании, true = активный чат)';
COMMENT ON COLUMN private_chats.initial_message IS 'Текст первого сообщения';
COMMENT ON COLUMN private_chats.blocked_by IS 'ID пользователя, который заблокировал чат';

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_private_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_private_chats_updated_at ON private_chats;
CREATE TRIGGER trigger_update_private_chats_updated_at
    BEFORE UPDATE ON private_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_private_chats_updated_at();

-- RLS политики (отключаем для начала, так как используем Service Role)
ALTER TABLE private_chats ENABLE ROW LEVEL SECURITY;

-- Разрешаем все операции для service_role (используется в API)
CREATE POLICY "Service role has full access"
    ON private_chats
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Разрешаем чтение всем (анонимным тоже через service_role)
CREATE POLICY "Allow read access"
    ON private_chats
    FOR SELECT
    USING (true);

-- Разрешаем update через service_role
CREATE POLICY "Allow update through service"
    ON private_chats
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Разрешаем insert через service_role
CREATE POLICY "Allow insert through service"
    ON private_chats
    FOR INSERT
    WITH CHECK (true);

-- Разрешаем delete через service_role  
CREATE POLICY "Allow delete through service"
    ON private_chats
    FOR DELETE
    USING (true);
