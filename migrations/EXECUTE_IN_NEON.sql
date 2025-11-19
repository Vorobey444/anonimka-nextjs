-- Выполнить эту миграцию в Neon Console (https://console.neon.tech)
-- 1. Откройте вашу базу данных
-- 2. Перейдите в SQL Editor
-- 3. Скопируйте и выполните этот SQL:

-- Добавление колонок для хранения согласия с условиями использования
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE;

ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS agreed_at TIMESTAMP WITH TIME ZONE;

-- Создаём индекс для быстрой проверки согласия
CREATE INDEX IF NOT EXISTS idx_ads_agreed_to_terms ON ads(agreed_to_terms);

-- Комментарии
COMMENT ON COLUMN ads.agreed_to_terms IS 'Пользователь согласился с условиями использования';
COMMENT ON COLUMN ads.agreed_at IS 'Время согласия с условиями';

-- Проверка результата
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ads' AND column_name IN ('agreed_to_terms', 'agreed_at');
