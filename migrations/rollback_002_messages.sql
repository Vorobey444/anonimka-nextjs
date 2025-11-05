-- ОТКАТ миграции 002: Восстановление messages из резерва

BEGIN;

-- Проверяем что резерв существует
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'messages_backup_20250105') THEN
        RAISE EXCEPTION 'Backup table messages_backup_20250105 not found!';
    END IF;
END $$;

-- Удаляем текущую таблицу
DROP TABLE IF EXISTS messages CASCADE;

-- Восстанавливаем из резерва
CREATE TABLE messages AS 
SELECT * FROM messages_backup_20250105;

-- Восстанавливаем индексы
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

DO $$
BEGIN
    RAISE NOTICE 'Rollback 002 completed - messages restored from backup';
END $$;

COMMIT;
