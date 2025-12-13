-- Добавление колонок для хранения локации пользователя
-- Дата: 2025-12-13

-- Добавляем колонки country, region, city если их нет
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS region VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(255);

-- Создаем индекс для быстрого поиска по стране/городу
CREATE INDEX IF NOT EXISTS idx_users_location ON users(country, city);

-- Комментарии для понимания назначения колонок
COMMENT ON COLUMN users.country IS 'ISO код страны (например, KZ, RU, US)';
COMMENT ON COLUMN users.region IS 'Область/регион пользователя';
COMMENT ON COLUMN users.city IS 'Город пользователя';
