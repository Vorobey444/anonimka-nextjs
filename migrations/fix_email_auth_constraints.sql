-- Миграция: Исправление constraints для email авторизации
-- Дата: 2025-11-29
-- Проблема: id является PRIMARY KEY и используется как Telegram ID, но для email пользователей его нет

-- Решение: Генерировать случайный большой ID для email пользователей
-- Диапазон: 10000000000000 - 19999999999999 (не пересекается с реальными Telegram ID)

-- 1. Создаём функцию для генерации ID для email пользователей
CREATE OR REPLACE FUNCTION generate_email_user_id() RETURNS BIGINT AS $$
DECLARE
  new_id BIGINT;
  attempts INT := 0;
  max_attempts INT := 100;
BEGIN
  LOOP
    -- Генерируем случайный ID в диапазоне 10^13 - 2*10^13
    new_id := 10000000000000 + floor(random() * 10000000000000)::BIGINT;
    
    -- Проверяем уникальность
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = new_id) THEN
      RETURN new_id;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Не удалось сгенерировать уникальный ID после % попыток', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

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
  RAISE NOTICE 'Функция generate_email_user_id создана: %',
    EXISTS(SELECT FROM pg_proc WHERE proname = 'generate_email_user_id');
  RAISE NOTICE 'Таблица verification_codes существует: %',
    EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'verification_codes');
  RAISE NOTICE 'Тестовый ID для email пользователя: %', generate_email_user_id();
END $$;

-- Комментарии
COMMENT ON FUNCTION generate_email_user_id() IS 'Генерирует уникальный ID для email пользователей (диапазон 10^13 - 2*10^13)';
COMMENT ON COLUMN users.id IS 'Telegram ID (1-9999999999999) для Telegram пользователей, сгенерированный ID (10^13+) для email пользователей';
COMMENT ON TABLE verification_codes IS 'Коды подтверждения для email авторизации (живут 10 минут)';
