-- Миграция 002: Анонимизация messages
-- Заменяем sender_id на sender_token для полной конфиденциальности

-- ===== ШАГ 1: РЕЗЕРВНАЯ КОПИЯ =====
CREATE TABLE IF NOT EXISTS messages_backup_20250105 AS 
SELECT * FROM messages;

-- ===== ШАГ 2: ДОБАВЛЯЕМ НОВУЮ КОЛОНКУ =====
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_token TEXT;

-- ===== ШАГ 3: МИГРАЦИЯ ДАННЫХ =====
-- Заполняем sender_token из ads по sender_id (tg_id)
-- Оба приводим к TEXT для совместимости
UPDATE messages m
SET sender_token = (
    SELECT a.user_token 
    FROM ads a 
    WHERE a.tg_id::text = m.sender_id::text
    ORDER BY a.created_at DESC 
    LIMIT 1
)
WHERE sender_token IS NULL AND sender_id IS NOT NULL;

-- Для сообщений от пользователей без анкет - генерируем токен
UPDATE messages
SET sender_token = 'migrated_sender_' || sender_id || '_' || md5(random()::text)
WHERE sender_token IS NULL AND sender_id IS NOT NULL;

-- ===== ШАГ 4: СОЗДАЕМ ИНДЕКСЫ =====
CREATE INDEX IF NOT EXISTS idx_messages_sender_token ON messages(sender_token);
CREATE INDEX IF NOT EXISTS idx_messages_chat_sender 
    ON messages(chat_id, sender_token, created_at DESC);

-- ===== ШАГ 5: ДЕЛАЕМ ОБЯЗАТЕЛЬНЫМ =====
ALTER TABLE messages 
ALTER COLUMN sender_token SET NOT NULL;

-- ===== ОПЦИОНАЛЬНО: УДАЛЕНИЕ СТАРОЙ КОЛОНКИ =====
-- Раскомментируйте после проверки:
-- ALTER TABLE messages DROP COLUMN IF EXISTS sender_id;

-- ===== ПРОВЕРКА =====
DO $$
DECLARE
    backup_count INTEGER;
    current_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM messages_backup_20250105;
    SELECT COUNT(*) INTO current_count FROM messages;
    
    RAISE NOTICE 'Messages backup rows: %, Current rows: %', backup_count, current_count;
    
    IF backup_count != current_count THEN
        RAISE EXCEPTION 'Migration 002 failed: row count mismatch!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM messages WHERE sender_token IS NULL) THEN
        RAISE EXCEPTION 'Migration 002 failed: NULL sender_token found!';
    END IF;
    
    RAISE NOTICE 'Migration 002 completed successfully!';
END $$;
