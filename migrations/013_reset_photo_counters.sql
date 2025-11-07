-- Миграция 013: Сброс счетчиков фото (одноразовая очистка после фикса бага)
-- Проблема: До исправления веб-пользователи могли обходить лимит фото
-- Решение: Сбрасываем все счетчики для честного старта

-- Сбрасываем счетчики для Telegram пользователей
UPDATE user_limits 
SET photos_sent_today = 0,
    photos_last_reset = CURRENT_DATE,
    updated_at = NOW()
WHERE photos_last_reset < CURRENT_DATE 
   OR photos_sent_today > 5; -- Сбрасываем аномальные значения

-- Если таблица web_user_limits уже существует, сбрасываем и там
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'web_user_limits'
    ) THEN
        UPDATE web_user_limits 
        SET photos_sent_today = 0,
            photos_last_reset = CURRENT_DATE,
            updated_at = NOW();
        
        RAISE NOTICE '✅ Счетчики фото сброшены для веб-пользователей';
    END IF;
END $$;

-- Проверка результата
DO $$
DECLARE
    tg_count INTEGER;
    web_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tg_count FROM user_limits WHERE photos_sent_today = 0;
    
    SELECT COUNT(*) INTO web_count FROM web_user_limits WHERE photos_sent_today = 0;
    
    RAISE NOTICE '✅ Миграция 013 завершена:';
    RAISE NOTICE '   - Telegram пользователей сброшено: %', tg_count;
    RAISE NOTICE '   - Веб-пользователей сброшено: %', web_count;
END $$;
