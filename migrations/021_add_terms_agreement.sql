-- Добавление колонок для хранения согласия с условиями использования в таблицу USERS

-- Добавляем колонку для хранения статуса согласия (если не существует)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE;

-- Добавляем колонку для хранения времени согласия (если не существует)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agreed_at TIMESTAMP WITH TIME ZONE;

-- Создаём индекс для быстрой проверки согласия
CREATE INDEX IF NOT EXISTS idx_users_agreed_to_terms ON users(agreed_to_terms);

-- Комментарии
COMMENT ON COLUMN users.agreed_to_terms IS 'Пользователь согласился с условиями использования';
COMMENT ON COLUMN users.agreed_at IS 'Время согласия с условиями';
