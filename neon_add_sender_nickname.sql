-- Миграция для Neon PostgreSQL
-- Добавление поля sender_nickname в таблицу messages

-- Добавляем поле sender_nickname
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_nickname TEXT DEFAULT 'Анонимный';

-- Комментарий к полю
COMMENT ON COLUMN messages.sender_nickname IS 'Nickname отправителя сообщения (username или first_name из Telegram)';

-- Проверяем результат
SELECT id, sender_id, sender_nickname, message, created_at 
FROM messages 
ORDER BY created_at DESC 
LIMIT 5;
