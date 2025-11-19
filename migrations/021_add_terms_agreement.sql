-- Добавление колонок для хранения согласия с условиями использования

-- Добавляем колонку для хранения статуса согласия (если не существует)
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE;

-- Добавляем колонку для хранения времени согласия (если не существует)
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS agreed_at TIMESTAMP WITH TIME ZONE;

-- Создаём индекс для быстрой проверки согласия
CREATE INDEX IF NOT EXISTS idx_ads_agreed_to_terms ON ads(agreed_to_terms);

-- Комментарии
COMMENT ON COLUMN ads.agreed_to_terms IS 'Пользователь согласился с условиями использования';
COMMENT ON COLUMN ads.agreed_at IS 'Время согласия с условиями';
