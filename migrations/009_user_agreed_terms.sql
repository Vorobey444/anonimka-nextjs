-- Миграция 009: Добавление поля согласия с условиями
-- Дата: 2025-11-10

-- Добавляем поле agreed_to_terms
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE;

-- Добавляем поле даты согласия
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agreed_at TIMESTAMP;

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_agreed_terms ON users(agreed_to_terms);
