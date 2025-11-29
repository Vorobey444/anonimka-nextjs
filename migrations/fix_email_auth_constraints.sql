-- Миграция: Исправление constraints для email авторизации
-- Дата: 2025-11-29
-- Проблема: id и user_token имеют NOT NULL, но для email пользователей id отсутствует

-- 1. Делаем колонку id nullable (для email пользователей у которых нет Telegram ID)
ALTER TABLE users ALTER COLUMN id DROP NOT NULL;

-- 2. Создаём таблицу verification_codes если её нет
CREATE TABLE IF NOT EXISTS verification_codes (
  email VARCHAR(255) PRIMARY KEY,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Создаём индексы для verification_codes
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- 4. Проверка изменений
DO $$ 
BEGIN
  RAISE NOTICE 'Миграция завершена!';
  RAISE NOTICE 'Колонка users.id теперь nullable: %', 
    (SELECT is_nullable FROM information_schema.columns 
     WHERE table_name = 'users' AND column_name = 'id');
  RAISE NOTICE 'Таблица verification_codes существует: %',
    EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'verification_codes');
END $$;

-- Комментарии
COMMENT ON COLUMN users.id IS 'Telegram ID для Telegram пользователей, NULL для email пользователей';
COMMENT ON TABLE verification_codes IS 'Коды подтверждения для email авторизации (живут 10 минут)';
