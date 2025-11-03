-- Миграция для Neon PostgreSQL
-- Обновление таблицы private_chats - добавление поля last_message_at

-- Добавляем поле last_message_at если его нет
ALTER TABLE private_chats 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Обновляем существующие записи
UPDATE private_chats 
SET last_message_at = updated_at 
WHERE last_message_at IS NULL;

-- Создаём индекс для сортировки по последнему сообщению
CREATE INDEX IF NOT EXISTS idx_private_chats_last_message ON private_chats(last_message_at DESC);

-- Комментарий к полю
COMMENT ON COLUMN private_chats.last_message_at IS 'Время последнего сообщения в чате';
