-- Миграция 001: Полная анонимизация private_chats
-- Заменяем числовые user1/user2 на анонимные токены user_token_1/user_token_2

-- ===== ШАГ 1: РЕЗЕРВНАЯ КОПИЯ =====
-- Создаем резервную таблицу (на случай отката)
CREATE TABLE IF NOT EXISTS private_chats_backup_20250105 AS 
SELECT * FROM private_chats;

-- ===== ШАГ 2: ДОБАВЛЯЕМ НОВЫЕ КОЛОНКИ =====
-- Добавляем колонки для анонимных токенов
ALTER TABLE private_chats 
ADD COLUMN IF NOT EXISTS user_token_1 TEXT,
ADD COLUMN IF NOT EXISTS user_token_2 TEXT;

-- ===== ШАГ 3: МИГРАЦИЯ ДАННЫХ =====
-- Заполняем user_token_1 из ads по user1 (tg_id)
-- Оба приводим к TEXT для совместимости
UPDATE private_chats pc
SET user_token_1 = (
    SELECT a.user_token 
    FROM ads a 
    WHERE a.tg_id::text = pc.user1::text
    ORDER BY a.created_at DESC 
    LIMIT 1
)
WHERE user_token_1 IS NULL AND user1 IS NOT NULL;

-- Заполняем user_token_2 из ads по user2 (tg_id)
UPDATE private_chats pc
SET user_token_2 = (
    SELECT a.user_token 
    FROM ads a 
    WHERE a.tg_id::text = pc.user2::text
    ORDER BY a.created_at DESC 
    LIMIT 1
)
WHERE user_token_2 IS NULL AND user2 IS NOT NULL;

-- Для записей без анкет (если user не создавал анкету) - генерируем временный токен
UPDATE private_chats
SET user_token_1 = 'migrated_' || user1 || '_' || md5(random()::text)
WHERE user_token_1 IS NULL AND user1 IS NOT NULL;

UPDATE private_chats
SET user_token_2 = 'migrated_' || user2 || '_' || md5(random()::text)
WHERE user_token_2 IS NULL AND user2 IS NOT NULL;

-- ===== ШАГ 4: СОЗДАЕМ ИНДЕКСЫ =====
-- Оптимизация запросов по новым колонкам
CREATE INDEX IF NOT EXISTS idx_private_chats_user_token_1 ON private_chats(user_token_1);
CREATE INDEX IF NOT EXISTS idx_private_chats_user_token_2 ON private_chats(user_token_2);
CREATE INDEX IF NOT EXISTS idx_private_chats_tokens_accepted 
    ON private_chats(user_token_1, user_token_2, accepted);

-- ===== ШАГ 5: ДЕЛАЕМ ОБЯЗАТЕЛЬНЫМИ (после заполнения) =====
-- Теперь можно установить NOT NULL
ALTER TABLE private_chats 
ALTER COLUMN user_token_1 SET NOT NULL,
ALTER COLUMN user_token_2 SET NOT NULL;

-- ===== ОПЦИОНАЛЬНО: УДАЛЕНИЕ СТАРЫХ КОЛОНОК =====
-- Раскомментируйте после проверки, что всё работает:
-- ALTER TABLE private_chats DROP COLUMN IF EXISTS user1;
-- ALTER TABLE private_chats DROP COLUMN IF EXISTS user2;

-- ===== ПРОВЕРКА =====
-- Количество записей до и после должно совпадать
DO $$
DECLARE
    backup_count INTEGER;
    current_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM private_chats_backup_20250105;
    SELECT COUNT(*) INTO current_count FROM private_chats;
    
    RAISE NOTICE 'Backup rows: %, Current rows: %', backup_count, current_count;
    
    IF backup_count != current_count THEN
        RAISE EXCEPTION 'Migration failed: row count mismatch!';
    END IF;
    
    -- Проверяем что все токены заполнены
    IF EXISTS (SELECT 1 FROM private_chats WHERE user_token_1 IS NULL OR user_token_2 IS NULL) THEN
        RAISE EXCEPTION 'Migration failed: NULL tokens found!';
    END IF;
    
    RAISE NOTICE 'Migration 001 completed successfully!';
END $$;
