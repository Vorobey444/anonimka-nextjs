-- Migration 030: Автоматическое открепление истекших анкет
-- Дата: 2025-11-23
-- Описание: Добавляет функцию для автоматической очистки истекших закреплений

-- 1. Создаем индекс для быстрого поиска закреплений по дате истечения
CREATE INDEX IF NOT EXISTS idx_ads_pinned_until 
ON ads(is_pinned, pinned_until) 
WHERE is_pinned = true;

-- 2. Функция для автоматической очистки истекших закреплений
CREATE OR REPLACE FUNCTION unpin_expired_ads()
RETURNS TABLE(unpinned_count INTEGER) AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE ads 
    SET is_pinned = false 
    WHERE is_pinned = true 
      AND pinned_until IS NOT NULL 
      AND pinned_until < NOW();
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 3. Комментарии
COMMENT ON FUNCTION unpin_expired_ads() IS 'Автоматически открепляет анкеты с истекшим сроком закрепления';
COMMENT ON INDEX idx_ads_pinned_until IS 'Индекс для быстрого поиска закрепленных анкет по дате истечения';

-- 4. Разовая очистка всех истекших закреплений
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT unpinned_count INTO result_count FROM unpin_expired_ads();
    RAISE NOTICE '✅ Migration 030: Откреплено % истекших анкет', result_count;
END $$;

-- 5. Проверка результатов
SELECT 
    COUNT(*) FILTER (WHERE is_pinned = true AND pinned_until > NOW()) as active_pinned,
    COUNT(*) FILTER (WHERE is_pinned = true AND pinned_until < NOW()) as expired_but_still_pinned,
    COUNT(*) FILTER (WHERE is_pinned = false AND pinned_until IS NOT NULL AND pinned_until < NOW()) as correctly_unpinned
FROM ads;

COMMIT;
