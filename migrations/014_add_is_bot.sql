-- Добавление поля is_bot к существующей таблице world_chat_messages
-- Это позволит различать сообщения от ботов

ALTER TABLE world_chat_messages 
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;

-- Добавить индекс для фильтрации
CREATE INDEX IF NOT EXISTS idx_world_chat_is_bot ON world_chat_messages(is_bot);

-- Комментарий
COMMENT ON COLUMN world_chat_messages.is_bot IS 'TRUE если сообщение от бота активности';
