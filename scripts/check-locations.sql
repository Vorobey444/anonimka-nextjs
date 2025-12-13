-- Скрипт для проверки и миграции данных location в users
-- Выполнить через Vercel Postgres console или API

-- 1. Посмотреть текущие данные
SELECT id, display_nickname, location, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 30;

-- 2. Статистика по форматам location
SELECT 
  COUNT(*) as total,
  COUNT(location) as with_location,
  COUNT(*) FILTER (WHERE location IS NULL) as null_location,
  COUNT(*) FILTER (WHERE location::text LIKE '%"country"%') as correct_json_format,
  COUNT(*) FILTER (WHERE location::text NOT LIKE '%"country"%' AND location IS NOT NULL) as other_format
FROM users;

-- 3. Примеры неправильных форматов
SELECT id, display_nickname, location::text
FROM users 
WHERE location IS NOT NULL 
  AND location::text NOT LIKE '%"country"%'
LIMIT 10;
