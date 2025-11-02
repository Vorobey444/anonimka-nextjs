-- Добавление поля nickname в таблицу ads
-- Выполните этот SQL скрипт в Supabase SQL Editor

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT 'Анонимный';

-- Добавляем комментарий к полю
COMMENT ON COLUMN ads.nickname IS 'Псевдоним пользователя в объявлении (может отличаться от имени в Telegram)';

-- Обновляем существующие записи, если нужно
UPDATE ads
SET nickname = 'Анонимный'
WHERE nickname IS NULL;

-- Проверяем результат
SELECT id, nickname, gender, city, created_at
FROM ads
ORDER BY created_at DESC
LIMIT 5;
