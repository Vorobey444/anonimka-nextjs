-- ============================================
-- МИГРАЦИЯ: Добавление третьего напоминания
-- Дата: 2025-11-23
-- ============================================

BEGIN;

-- Добавляем колонку для третьего напоминания
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS third_reminder_sent TIMESTAMP WITH TIME ZONE;

-- Создаем индекс для оптимизации запросов напоминаний
CREATE INDEX IF NOT EXISTS idx_users_third_reminder 
ON users(third_reminder_sent) 
WHERE third_reminder_sent IS NOT NULL;

-- Добавляем комментарий
COMMENT ON COLUMN users.third_reminder_sent IS 'Timestamp когда было отправлено третье напоминание о создании анкеты (через ~3 дня после регистрации)';

-- Проверка
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'third_reminder_sent'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Колонка third_reminder_sent успешно добавлена';
  ELSE
    RAISE EXCEPTION '❌ Ошибка: колонка third_reminder_sent не была добавлена';
  END IF;
END $$;

COMMIT;
