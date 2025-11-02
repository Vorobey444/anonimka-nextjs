-- =====================================================
-- ТАБЛИЦА: private_chats
-- Описание: Приватные чаты между пользователями
-- =====================================================

CREATE TABLE IF NOT EXISTS private_chats (
    id BIGSERIAL PRIMARY KEY,
    user1 BIGINT NOT NULL,                    -- Инициатор чата (кто отправил запрос)
    user2 BIGINT NOT NULL,                    -- Получатель запроса
    ad_id BIGINT,                             -- ID объявления (может быть NULL)
    accepted BOOLEAN DEFAULT false,           -- Принят ли запрос на чат
    blocked_by BIGINT DEFAULT NULL,           -- ID пользователя, который заблокировал чат
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ для быстрого поиска
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_private_chats_user1 ON private_chats(user1);
CREATE INDEX IF NOT EXISTS idx_private_chats_user2 ON private_chats(user2);
CREATE INDEX IF NOT EXISTS idx_private_chats_ad_id ON private_chats(ad_id);
CREATE INDEX IF NOT EXISTS idx_private_chats_accepted ON private_chats(accepted) WHERE accepted = true;

-- Уникальный индекс для предотвращения дублей (один чат на пару пользователей + объявление)
CREATE UNIQUE INDEX IF NOT EXISTS idx_private_chats_unique 
    ON private_chats(user1, user2, ad_id) 
    WHERE blocked_by IS NULL;

-- =====================================================
-- КОММЕНТАРИИ к полям
-- =====================================================

COMMENT ON TABLE private_chats IS 'Приватные чаты между пользователями (запросы и принятые чаты)';
COMMENT ON COLUMN private_chats.user1 IS 'Telegram ID инициатора чата (кто отправил запрос)';
COMMENT ON COLUMN private_chats.user2 IS 'Telegram ID получателя запроса';
COMMENT ON COLUMN private_chats.ad_id IS 'ID объявления, по которому создан чат (NULL если чат без объявления)';
COMMENT ON COLUMN private_chats.accepted IS 'Принят ли запрос на чат (false = входящий запрос, true = активный чат)';
COMMENT ON COLUMN private_chats.blocked_by IS 'ID пользователя, который заблокировал чат (NULL если не заблокирован)';

-- =====================================================
-- RLS ПОЛИТИКИ (Row Level Security)
-- =====================================================

ALTER TABLE private_chats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- АНОНИМНЫЙ ДОСТУП (для публичного anon ключа)
-- Это основной способ доступа для нашего приложения
-- =====================================================

-- Позволяем SELECT для anon роли (публичный ключ)
CREATE POLICY "Anon can view all chats"
    ON private_chats FOR SELECT
    TO anon
    USING (true);

-- Позволяем INSERT для anon роли
CREATE POLICY "Anon can create chats"
    ON private_chats FOR INSERT
    TO anon
    WITH CHECK (true);

-- Позволяем UPDATE для anon роли
CREATE POLICY "Anon can update chats"
    ON private_chats FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Позволяем DELETE для anon роли
CREATE POLICY "Anon can delete chats"
    ON private_chats FOR DELETE
    TO anon
    USING (true);

-- =====================================================
-- СПРАВКА ПО ИСПОЛЬЗОВАНИЮ
-- =====================================================

/*
ПРИМЕРЫ ЗАПРОСОВ:

1. Создать запрос на чат:
INSERT INTO private_chats (user1, user2, ad_id, accepted)
VALUES (123456, 789012, 1, false);

2. Получить входящие запросы:
SELECT * FROM private_chats 
WHERE user2 = 789012 AND accepted = false AND blocked_by IS NULL;

3. Принять запрос на чат:
UPDATE private_chats 
SET accepted = true 
WHERE id = 1 AND user2 = 789012;

4. Получить активные чаты пользователя:
SELECT * FROM private_chats 
WHERE (user1 = 123456 OR user2 = 123456) 
  AND accepted = true 
  AND blocked_by IS NULL
ORDER BY created_at DESC;

5. Заблокировать чат:
UPDATE private_chats 
SET blocked_by = 123456 
WHERE id = 1;

6. Отклонить запрос (удалить):
DELETE FROM private_chats 
WHERE id = 1 AND user2 = 789012 AND accepted = false;
*/
