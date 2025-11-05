-- ОТКАТ миграции 001: Восстановление private_chats из резерва

-- ===== ВНИМАНИЕ =====
-- Используйте этот скрипт ТОЛЬКО если что-то пошло не так!
-- После отката потребуется восстановить приложение к старой версии кода

BEGIN;

-- Проверяем что резерв существует
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'private_chats_backup_20250105') THEN
        RAISE EXCEPTION 'Backup table private_chats_backup_20250105 not found!';
    END IF;
END $$;

-- Удаляем текущую таблицу
DROP TABLE IF EXISTS private_chats CASCADE;

-- Восстанавливаем из резерва
CREATE TABLE private_chats AS 
SELECT * FROM private_chats_backup_20250105;

-- Восстанавливаем индексы
CREATE INDEX IF NOT EXISTS idx_private_chats_user1 ON private_chats(user1);
CREATE INDEX IF NOT EXISTS idx_private_chats_user2 ON private_chats(user2);
CREATE INDEX IF NOT EXISTS idx_private_chats_accepted ON private_chats(accepted);

DO $$
BEGIN
    RAISE NOTICE 'Rollback 001 completed - private_chats restored from backup';
END $$;

COMMIT;
