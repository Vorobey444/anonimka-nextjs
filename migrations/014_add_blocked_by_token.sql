-- Миграция 014: Добавляем колонку blocked_by_token и делаем user_blocks более гибким
-- Цели:
-- 1. private_chats: добавить blocked_by_token (TEXT) для веб/анон пользователей без numeric tg_id
-- 2. user_blocks: убедиться что есть blocker_token/blocked_token, снять NOT NULL с blocker_id/blocked_id
-- 3. Создать индексы для быстрого определения блокировки

BEGIN;

-- 1. private_chats: новая колонка для токеновой блокировки
ALTER TABLE private_chats
  ADD COLUMN IF NOT EXISTS blocked_by_token TEXT;

-- Индекс для токеновой блокировки
CREATE INDEX IF NOT EXISTS idx_private_chats_blocked_by_token ON private_chats(blocked_by_token);

-- 2. user_blocks: добавить токеновые колонки, если отсутствуют
ALTER TABLE user_blocks
  ADD COLUMN IF NOT EXISTS blocker_token TEXT,
  ADD COLUMN IF NOT EXISTS blocked_token TEXT;

-- Снять NOT NULL (если было) с legacy bigint колонок, чтобы можно было хранить только токены
DO $$
BEGIN
  BEGIN
    ALTER TABLE user_blocks ALTER COLUMN blocker_id DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN
    -- Колонка могла быть уже удалена или отсутствует – игнорируем
  END;
  BEGIN
    ALTER TABLE user_blocks ALTER COLUMN blocked_id DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN
  END;
END $$;

-- Удалить старый уникальный индекс (если существует) и создать уникальность по токенам
DO $$
BEGIN
  BEGIN
    ALTER TABLE user_blocks DROP CONSTRAINT unique_block;
  EXCEPTION WHEN undefined_object THEN
  END;
  BEGIN
    ALTER TABLE user_blocks DROP CONSTRAINT unique_block_tokens;
  EXCEPTION WHEN undefined_object THEN
  END;
  -- Создаём новую уникальность: если токены есть – по ним, иначе fallback по числам
  CREATE UNIQUE INDEX IF NOT EXISTS user_blocks_unique_tokens
    ON user_blocks (COALESCE(blocker_token, blocker_id::text), COALESCE(blocked_token, blocked_id::text));
END $$;

-- Индексы для колонок токенов
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_token ON user_blocks(blocker_token);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_token ON user_blocks(blocked_token);

-- Комментарии
COMMENT ON COLUMN private_chats.blocked_by_token IS 'User token того, кто заблокировал чат (альтернатива blocked_by)';
COMMENT ON COLUMN user_blocks.blocker_token IS 'User token инициатора блокировки';
COMMENT ON COLUMN user_blocks.blocked_token IS 'User token заблокированного';

COMMIT;

-- Проверка результатов
DO $$
DECLARE
  has_col BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='private_chats' AND column_name='blocked_by_token'
  ) INTO has_col;
  IF has_col THEN
    RAISE NOTICE '✅ Колонка blocked_by_token добавлена';
  ELSE
    RAISE WARNING '⚠️ Колонка blocked_by_token не найдена';
  END IF;
END $$;
