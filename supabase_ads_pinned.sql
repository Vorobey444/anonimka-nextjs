-- Добавление полей для закрепления объявлений

-- Добавляем поле is_pinned (флаг закрепления)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Добавляем поле pinned_until (время до которого объявление закреплено)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS pinned_until TIMESTAMP WITH TIME ZONE;

-- Создаем индекс для быстрой сортировки закрепленных объявлений
CREATE INDEX IF NOT EXISTS idx_ads_pinned ON ads(is_pinned DESC, created_at DESC);

-- Комментарии к полям
COMMENT ON COLUMN ads.is_pinned IS 'Флаг закрепления объявления (платная функция)';
COMMENT ON COLUMN ads.pinned_until IS 'Время до которого объявление закреплено (обычно 24 часа)';
