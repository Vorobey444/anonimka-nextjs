-- Поиск таблиц со словом "message"
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%message%' 
   OR table_name LIKE '%chat%'
ORDER BY table_name;

-- Поиск всех таблиц в БД
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
