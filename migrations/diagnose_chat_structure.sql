-- Диагностика: Посмотреть структуру таблиц

-- 1. Структура private_chats
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'private_chats'
ORDER BY ordinal_position;

-- 2. Структура private_messages
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'private_messages'
ORDER BY ordinal_position;

-- 3. Пример данных из private_chats (первая запись)
SELECT * FROM private_chats LIMIT 1;

-- 4. Пример данных из private_messages (первая запись)
SELECT * FROM private_messages LIMIT 1;
