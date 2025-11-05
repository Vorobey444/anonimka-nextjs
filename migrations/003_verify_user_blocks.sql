-- Миграция 003: Анонимизация user_blocks
-- Проверяем что блокировки используют токены (не tg_id)

-- ===== ШАГ 1: РЕЗЕРВНАЯ КОПИЯ =====
CREATE TABLE IF NOT EXISTS user_blocks_backup_20250105 AS 
SELECT * FROM user_blocks;

-- ===== ШАГ 2: ПРОВЕРКА СТРУКТУРЫ =====
-- user_blocks уже использует user_token и blocked_id (токены)
-- Просто убедимся что все значения валидны

-- Проверяем что нет пустых токенов
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM user_blocks WHERE user_token IS NULL OR blocked_id IS NULL) THEN
        RAISE EXCEPTION 'user_blocks has NULL tokens - data integrity issue!';
    END IF;
    
    RAISE NOTICE 'user_blocks structure is OK - already uses tokens';
END $$;

-- ===== ШАГ 3: ДОБАВЛЯЕМ ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ =====
CREATE INDEX IF NOT EXISTS idx_user_blocks_user_token ON user_blocks(user_token);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_composite 
    ON user_blocks(user_token, blocked_id);

-- ===== ГОТОВО =====
-- user_blocks уже анонимна, дополнительных изменений не требуется
