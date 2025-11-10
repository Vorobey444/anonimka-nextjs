-- ========================================
-- ПРИМЕНЕНИЕ МИГРАЦИЙ 009 и 010
-- Дата: 2025-11-10
-- ========================================

-- ========================================
-- МИГРАЦИЯ 010: Удаление unique constraint для nickname в ads
-- Проблема: Пользователи не могут создать несколько объявлений
-- Решение: Один пользователь может иметь много объявлений с одним никнеймом
-- ========================================

-- Удаляем constraint
ALTER TABLE ads DROP CONSTRAINT IF EXISTS unique_nickname;

-- Проверка: смотрим все constraints на таблице ads
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'ads'::regclass;

-- ========================================
-- МИГРАЦИЯ 009: Добавление полей онбординга в users
-- Цель: Хранить согласие пользователя с правилами
-- ========================================

-- Добавляем поле agreed_to_terms
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE;

-- Добавляем поле даты согласия
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agreed_at TIMESTAMP;

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_agreed_terms ON users(agreed_to_terms);

-- ========================================
-- ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ========================================

-- Проверяем структуру таблицы users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('agreed_to_terms', 'agreed_at', 'display_nickname')
ORDER BY column_name;

-- Проверяем индексы
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
AND indexname = 'idx_users_agreed_terms';

-- Проверяем constraints на таблице ads
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'ads'::regclass
ORDER BY conname;

-- ========================================
-- ГОТОВО!
-- Теперь пользователи могут:
-- 1. Создавать несколько объявлений с одним никнеймом
-- 2. Проходить онбординг с сохранением согласия в БД
-- ========================================
