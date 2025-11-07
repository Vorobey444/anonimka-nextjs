-- Миграция 011: Исправление схемы user_blocks для работы с токенами
-- Проблема: таблица использует blocker_id/blocked_id (BIGINT), нужны blocker_token/blocked_token (TEXT)

DO $$ 
BEGIN
    -- Проверяем существование колонки blocker_token
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_blocks' AND column_name = 'blocker_token'
    ) THEN
        -- Добавляем новые колонки с токенами
        ALTER TABLE user_blocks 
        ADD COLUMN blocker_token TEXT,
        ADD COLUMN blocked_token TEXT;
        
        RAISE NOTICE 'Добавлены колонки blocker_token и blocked_token';
    ELSE
        RAISE NOTICE 'Колонка blocker_token уже существует, пропускаем добавление';
    END IF;

    -- Удаляем старые внешние ключи если они есть
    BEGIN
        ALTER TABLE user_blocks DROP CONSTRAINT IF EXISTS user_blocks_blocker_id_fkey;
        ALTER TABLE user_blocks DROP CONSTRAINT IF EXISTS user_blocks_blocked_id_fkey;
        RAISE NOTICE 'Удалены старые внешние ключи';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Внешние ключи не найдены или уже удалены';
    END;

    -- Удаляем старое ограничение уникальности
    BEGIN
        ALTER TABLE user_blocks DROP CONSTRAINT IF EXISTS unique_block;
        RAISE NOTICE 'Удалено старое ограничение unique_block';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Ограничение unique_block не найдено';
    END;

    -- Добавляем новое ограничение уникальности для токенов
    BEGIN
        ALTER TABLE user_blocks 
        ADD CONSTRAINT unique_block_tokens UNIQUE (blocker_token, blocked_token);
        RAISE NOTICE 'Добавлено ограничение уникальности для токенов';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Ограничение unique_block_tokens уже существует';
    END;

    -- Создаем индексы для быстрого поиска по токенам
    CREATE INDEX IF NOT EXISTS idx_blocker_token ON user_blocks(blocker_token);
    CREATE INDEX IF NOT EXISTS idx_blocked_token ON user_blocks(blocked_token);
    CREATE INDEX IF NOT EXISTS idx_block_pair_tokens ON user_blocks(blocker_token, blocked_token);
    
    RAISE NOTICE 'Созданы индексы для токенов';

END $$;

-- Комментарии
COMMENT ON COLUMN user_blocks.blocker_token IS 'User token пользователя, который заблокировал';
COMMENT ON COLUMN user_blocks.blocked_token IS 'User token заблокированного пользователя';

-- Проверка результата
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'user_blocks' 
    AND column_name IN ('blocker_token', 'blocked_token');
    
    IF col_count = 2 THEN
        RAISE NOTICE '✅ Миграция 011 успешно применена: user_blocks теперь использует токены';
    ELSE
        RAISE WARNING '⚠️ Миграция 011: колонки токенов не найдены (найдено колонок: %)', col_count;
    END IF;
END $$;
