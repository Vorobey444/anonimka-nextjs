-- Добавление поля location в таблицу users для хранения местоположения пользователя
-- Локация хранится в формате JSON: {"country": "KZ", "region": "Алматинская область", "city": "Алматы"}

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location JSONB DEFAULT NULL;

-- Индекс для быстрого поиска по локации
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING gin(location);

-- Комментарий к полю
COMMENT ON COLUMN users.location IS 'Местоположение пользователя в формате JSON: {country, region, city}';
