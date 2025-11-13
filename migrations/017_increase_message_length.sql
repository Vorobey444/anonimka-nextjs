-- Migration 017: Increase message length limit from 50 to 120 characters
-- Drop old constraint and add new one

BEGIN;

-- Удаляем старый constraint
ALTER TABLE world_chat_messages 
DROP CONSTRAINT IF EXISTS world_chat_messages_message_check;

-- Добавляем новый constraint с лимитом 120 символов
ALTER TABLE world_chat_messages 
ADD CONSTRAINT world_chat_messages_message_check 
CHECK (char_length(message) <= 120);

COMMIT;

-- Проверка
-- SELECT char_length(message) as length, message 
-- FROM world_chat_messages 
-- ORDER BY char_length(message) DESC 
-- LIMIT 5;
